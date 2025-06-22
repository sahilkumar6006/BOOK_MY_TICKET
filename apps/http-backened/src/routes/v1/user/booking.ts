
import { Router } from "express";
import { client } from "@repo/db/client";
import { userMiddleware } from "src/middleware/user";
import { getRedisKey, incrCount } from "@repo/redis/client";
const router: Router = Router();


router.get("/user/booking", userMiddleware, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const booking = await client.booking.findMany({
        where: {
            userId: req.userId,


        },
        skip: skip,
        take: limit,
    })
    res.json({ booking })
});


router.post("/", userMiddleware, async (req, res) => {
    const { data, success } = req.body;
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    if (!success) {
        res.status(400).json({
            message: "Invalid data"
        });
        return;
    }

    const event = await client.event.findUnique({
        where: {
            id: data.eventId
        }
    });
    if (!event || event.startTime > new Date() || event.ended) {
        res.status(404).json({
            message: "Event not found or has ended"
        });
        return;
    }

    try {
        const counter = await incrCount(getRedisKey(`bookings-${data.eventId}`));
        const booking = await client.booking.create({
            data: {
                eventId: data.eventId,
                userId: userId,
                status: "Pending",
                sequenceNumber: counter,
                currentSequenceNumber: counter, // was giving a type error so added this TODO: need to figure out why
                seats: {
                    create: data.seats.map(seat => ({
                        seatTypeId: seat.id,
                        qr: ""
                    }))
                },
                expiry: new Date(new Date().getTime() + event.timeoutInS * 1000)
            }
        });

        res.json({
            id: booking.id
        })
        res.json({
            message: "Booking created successfully",
            booking
        });

    } catch (error) {
        res.status(500).json({
            message: "Could not create booking"
        });
        return;

    }

})
export default router;