import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { hasValidScale, isPositiveAmount } from '@app/shared';

/**
 * RF-41: el monto de un movimiento o gasto debe ser mayor a cero.
 * Opera sobre strings para preservar la exactitud decimal (RNF-11): nunca floats.
 */
export function IsPositiveMoney(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPositiveMoney',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' && typeof value !== 'number') {
            return false;
          }
          try {
            return isPositiveAmount(value);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} debe ser un monto mayor a cero`;
        },
      },
    });
  };
}

/**
 * RF-43: no se admiten montos con más de dos decimales.
 */
export function HasValidMoneyScale(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'hasValidMoneyScale',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' && typeof value !== 'number') {
            return false;
          }
          try {
            return hasValidScale(value);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} admite como máximo dos decimales`;
        },
      },
    });
  };
}
