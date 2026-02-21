import { Router, Request, Response } from 'express';
import { OTPService } from '../services/otp.service';
import { success, error } from '../utils/response';

const router = Router();

// Send OTP
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, purpose } = req.body;
    if (!phoneNumber) return error(res, 'Phone number is required', 400);

    const result = await OTPService.send(
      phoneNumber,
      purpose || 'verification'
    );

    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Verify OTP
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otpCode } = req.body;
    if (!phoneNumber || !otpCode) return error(res, 'Phone number and OTP code are required', 400);

    const result = await OTPService.verify(phoneNumber, otpCode);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;
