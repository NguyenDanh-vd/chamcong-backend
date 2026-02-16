import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    role?: string;
    vaiTro?: string;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = user?.role ?? user?.vaiTro;
    if (!userRole) return false;

    return requiredRoles.includes(userRole);
  }
}
