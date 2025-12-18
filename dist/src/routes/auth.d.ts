import { Request, Response, NextFunction } from 'express';
export declare const authRoutes: import("express-serve-static-core").Router;
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}
export declare const requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map