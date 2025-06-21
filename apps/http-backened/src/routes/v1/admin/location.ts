import { Router } from "express";
import { client } from "@repo/db/client";
import { adminAuth } from "../../../middleware";
import { CreateLocationSchema } from "@repo/common/types";


const router: Router = Router();

router.use(adminAuth);

router.post("/", async (req, res) => {

    const { data, success, error } = CreateLocationSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            message: "Invalid data",
            error: error?.issues
        });
        return;
    }

    try {
        const location = await client.location.create({
            data: {
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl
            }
        });

        res.json({
            id: location.id
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Could not create location"
        });
    }
})


router.get("/loactions", async (req, res) => {
    try {
        const locations = await client.location.findMany({
            include: {
                event: true
            }
        });
        res.json(locations);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Could not fetch locations"
        });
    }

});

export default router;