import { PartialType } from '@nestjs/swagger';
import { CreatePMScheduleDto } from './create-pm-schedule.dto';

export class UpdatePMScheduleDto extends PartialType(CreatePMScheduleDto) {}
