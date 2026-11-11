import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { SessionsJoinController } from './sessions-join.controller';
import { AttemptsService } from './attempts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AttemptsController, SessionsJoinController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
