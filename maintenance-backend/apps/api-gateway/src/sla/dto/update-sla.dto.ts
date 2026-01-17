import { PartialType } from '@nestjs/swagger';
import { CreateSLADto } from './create-sla.dto';

export class UpdateSLADto extends PartialType(CreateSLADto) {}
