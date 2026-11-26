import { PipeTransform, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../../utils/errors';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestError('Validation failed', details);
    }

    return result.data;
  }
}
