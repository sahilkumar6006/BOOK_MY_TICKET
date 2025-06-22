
import { Router } from "express";
import { client } from "@repo/db/client";
import { userMiddleware } from "src/middleware/user";

const router: Router = Router();

router.get("/", userMiddleware, async (req, res) => {
    const transcation = await client.payment.findMany({
        where: {
            userId: req.userId
        },
    })
    res.json({
        transcation
    });

});

export default router;