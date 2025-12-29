import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register route - optional authentication for admin user creation
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty()
  ],
  // Optional authentication - wenn Token vorhanden, wird er validiert
  (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      return authenticate(req, res, next);
    }
    next();
  },
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

export default router;
