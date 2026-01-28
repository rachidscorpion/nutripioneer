import { Hono } from 'hono';
import { menuController } from '@/controllers/menu.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const menu = new Hono();

menu.use('*', authMiddleware);

menu.post('/scan', (c) => menuController.scanMenu(c));

export default menu;
