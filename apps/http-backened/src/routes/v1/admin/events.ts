import { Router, Request, Response, RequestHandler } from "express";
import { client } from "@repo/db/client";
import { adminAuth } from "../../../middleware";
import { CreateEventSchema, UpdateEventSchema, UpdateSeatSchema } from "@repo/common/types";
import { getEvent } from "../../../controller";

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         totalSeats:
 *           type: integer
 *         availableSeats:
 *           type: integer
 *         price:
 *           type: number
 *           format: float
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const router: Router = Router();

// Apply admin authentication to all routes in this router
router.use(adminAuth as RequestHandler);

/**
 * @swagger
 * /api/v1/admin/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.post("/", async (req: Request, res: Response) => {
    const { data, success, error } = CreateEventSchema.safeParse(req.body);
    const adminId = req.userId;


    if (!adminId) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }

    if (!success) {
        res.status(400).json({
            message: "Invalid data"
        })
        return
    }

    try {
        const event = await client.event.create({
            data: {
                name: data.name,
                startTime: new Date(data.startTime),
                locationId: data.locationId,
                description: data.description,
                banner: data.banner,
                adminId,
                seatTypes: {
                    create: data.seats.map(seat => ({
                        name: seat.name,
                        description: seat.description,
                        price: seat.price,
                        capacity: seat.capacity
                    }))
                }
            }
        })

        res.json({
            id: event.id
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({
            message: "Could not create event"
        })
    }
});

router.put("/metadata/:eventId", async (req: Request, res: Response) => {
    const { data, success } = UpdateEventSchema.safeParse(req.body);
    const adminId = req.userId;
    const eventId = req.params.eventId ?? "";

    if (!adminId) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }

    if (!success) {
        res.status(400).json({
            message: "Invalid data"
        })
        return
    }

    try {
        const event = await client.event.findUnique({
            where: {
                id: eventId
            }
        })

        if (!event || event.adminId !== adminId) {
            res.status(404).json({
                message: "Cant update event"
            })
            return
        }

        await client.event.update({
            where: {
                id: eventId
            },
            data: {
                name: data.name,
                description: data.description,
                startTime: data.startTime,
                locationId: data.location,
                banner: data.banner,
                adminId,
                published: data.published,
                ended: data.ended
            }
        })

        res.json({
            id: event.id
        })
    } catch (e) {
        res.status(500).json({
            message: "Could not update event"
        })
    }

});

/**
 * @swagger
 * /api/v1/admin/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.get("/", async (req: Request, res: Response) => {
    const events = await client.event.findMany({
        where: {
            adminId: req.userId
        },
        include: {
            seatTypes: true
        }
    });

    res.json({
        events
    })
});

router.get("/:eventId", async (req: Request<{ eventId: string }>, res: Response) => {
    const adminId = req.userId;
    if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const event = await getEvent(req.params.eventId, adminId);

    if (!event) {
        res.status(404).json({
            message: "Event not found"
        })
        return
    }

    res.json({
        event
    });
});

router.put("/seats/:eventId", async (req: Request, res: Response) => {
    const { data, success } = UpdateSeatSchema.safeParse(req.body);
    const adminId = req.userId;
    const eventId = req.params.eventId ?? "";

    if (!success) {
        res.status(400).json({
            message: "Invalid data"
        })
        return
    }

    if (!adminId) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }

    if (!eventId) {
        res.status(400).json({
            message: "Invalid data"
        })
        return
    }

    const event = await client.event.findUnique({
        where: {
            id: eventId,
            adminId
        }
    })

    if (!event || event.startTime > new Date() || event.adminId !== adminId) {
        res.status(404).json({
            message: "Event not found or already started"
        })
        return
    }

    const currentSeats = await client.seatType.findMany({
        where: {
            eventId
        }
    })

    const newSeats = data.seats.filter(x => !x.id);
    const updatedSeats = data.seats.filter(x => x.id && currentSeats.find((y: { id: string | undefined; }) => y.id === x.id));
    const deletedSeats = currentSeats.filter((x: { id: string | undefined; }) => !data.seats.find(y => y.id === x.id));

    try {
        await client.$transaction([
            client.seatType.deleteMany({
                where: {
                    id: {
                        "in": deletedSeats.map((x: { id: any; }) => x.id)
                    }
                }
            }),
            client.seatType.createMany({
                data: newSeats.map(x => ({
                    name: x.name,
                    description: x.description,
                    price: x.price,
                    capacity: x.capacity,
                    eventId
                }))
            }),
            ...updatedSeats.map(x => client.seatType.update({
                where: {
                    id: x.id
                },
                data: {
                    name: x.name,
                    description: x.description,
                    price: x.price,
                    capacity: x.capacity
                }
            }))
        ])
    } catch (e) {
        res.status(500).json({
            message: "Could not update seats"
        });
    }
});

export default router;