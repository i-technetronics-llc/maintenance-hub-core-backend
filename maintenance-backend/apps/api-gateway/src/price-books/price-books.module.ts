import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceBook, PriceBookItem } from '@app/database/entities/price-book.entity';
import { PriceBooksController } from './price-books.controller';
import { PriceBooksService } from './price-books.service';

@Module({
  imports: [TypeOrmModule.forFeature([PriceBook, PriceBookItem])],
  controllers: [PriceBooksController],
  providers: [PriceBooksService],
  exports: [PriceBooksService],
})
export class PriceBooksModule {}
