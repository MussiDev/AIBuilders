import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Movement } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { ListMovementsQuery } from './dto/list-movements.query';
import {
  MovementsPage,
  MovementsService,
  PersonalBalance,
} from './movements.service';

/** Movimientos personales (RF-08 a 13). Protegido por sesión (RNF-06). */
@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movements: MovementsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateMovementDto,
  ): Promise<Movement> {
    return this.movements.create(userId, dto);
  }

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query() query: ListMovementsQuery,
  ): Promise<MovementsPage> {
    return this.movements.list(userId, query.page);
  }

  // Declarado antes de ':id' para que no lo capture la ruta con parámetro.
  @Get('balance')
  balance(@CurrentUserId() userId: string): Promise<PersonalBalance> {
    return this.movements.getBalance(userId);
  }

  @Get(':id')
  getOne(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Movement> {
    return this.movements.getOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMovementDto,
  ): Promise<Movement> {
    return this.movements.update(userId, id, dto);
  }

  // RF-46: la confirmación explícita de borrado la aplica el cliente antes de llamar.
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.movements.remove(userId, id);
  }
}
