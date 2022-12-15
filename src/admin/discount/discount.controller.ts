import { DiscountDto } from './dto/discount.dto';
import { user } from '@prisma/client';
import { DiscountService } from './discount.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Put,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiTags('Admin Discount')
@Controller('discount')
export class DiscountController {
  constructor(private discountService: DiscountService) {}
  @Post('addNewDiscount')
  addNewDiscount(@GetUser() user: user, @Body() dto: DiscountDto) {
    return this.discountService.addNewDiscount(user, dto);
  }

  @Get('getAllDiscountList')
  getAllDiscountList(@GetUser() user: user) {
    return this.discountService.getAllDiscountList(user);
  }

  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  })
  @ApiParam({
    description: 'param là id của discount, còn body là mảng id của sản phẩm',
    name: 'id',
  })
  @Put('editListProductsForDiscount/:id')
  editListProductsForDiscount(
    @GetUser() user: user,
    @Param('id') id: string,
    @Body() ls: number[],
  ) {
    return this.discountService.editListProductsForDiscount(user, id, ls);
  }

  @Patch('editDiscountInfo/:id')
  editDiscountInfo(
    @GetUser() user: user,
    @Param('id') id: string,
    @Body() dto: DiscountDto,
  ) {
    return this.discountService.editDiscountInfo(user, id, dto);
  }

  @Delete('deleteDiscount/:id')
  deleteDiscount(@GetUser() user: user, @Param('id') id: string) {
    return this.discountService.deleteDiscount(user, id);
  }
}
