import { Router } from "express";

const router = Router();

router.get("/wallet", (_req, res, _next) => {
    res.sendStatus(200);
});

export default router;
