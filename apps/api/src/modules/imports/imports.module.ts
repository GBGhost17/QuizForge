import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarkdownParserService } from './markdown-parser.service';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ImportsController],
  providers: [MarkdownParserService, ImportsService],
  exports: [MarkdownParserService, ImportsService],
})
export class ImportsModule {}
