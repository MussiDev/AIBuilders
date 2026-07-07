import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SharedExpense } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { SharedExpensesService } from './shared-expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

/** Gastos compartidos (RF-24, 25, 32, 33). Protegido por sesión (RNF-06). */
@Controller()
@UseGuards(JwtAuthGuard)
export class SharedExpensesController {
  constructor(private readonly expenses: SharedExpensesService) {}

  @Post('groups/:groupId/expenses')
  create(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreateExpenseDto,
  ): Promise<SharedExpense> {
    return this.expenses.create(userId, groupId, dto);
  }

  @Get('groups/:groupId/expenses')
  list(
    @CurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ): Promise<SharedExpense[]> {
    return this.expenses.list(userId, groupId);
  }

  @Get('expenses/:id')
  getOne(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<SharedExpense> {
    return this.expenses.getOne(userId, id);
  }

  @Patch('expenses/:id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<SharedExpense> {
    return this.expenses.update(userId, id, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.expenses.remove(userId, id);
  }
}
