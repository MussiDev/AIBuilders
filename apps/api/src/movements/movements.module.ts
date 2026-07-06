import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

@Module({
  imports: [AuthModule], // reusa JwtAuthGuard para proteger las rutas (RNF-06)
  controllers: [MovementsController],
  providers: [MovementsService],
  exports: [MovementsService],
})
export class MovementsModule {}
