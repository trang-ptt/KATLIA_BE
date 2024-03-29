import { ItemsModule } from './staff_import/items/items.module';
import { CartModule } from './cart/cart.module';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { MailModule } from './mail/mail.module';
import { CategoryModule } from './category/category.module';
import { DiscountModule } from './admin/discount/discount.module';
import { ProductAdminModule } from './admin/product_admin/product_admin.module';
import { AdminModule } from './admin/admin.module';
import { OrderModule } from './order/order.module';
import { AddressModule } from './address/address.module';
import { ProfileModule } from './profile/profile.module';
import { StaffOrderModule } from './staff_order/staff_order.module';
import { FilterModule } from './filter/filter.module';
import { StaffImportModule } from './staff_import/staff_import.module';
import { StatisticsModule } from './statistics/statistics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { MixModule } from './mix/mix.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    ProductModule,
    FilterModule,
    MailModule,
    AddressModule,
    ProfileModule,
    CategoryModule,
    CartModule,
    OrderModule,
    FeedbackModule,
    DiscountModule,
    ProductAdminModule,
    AdminModule,
    StaffOrderModule,
    StaffImportModule,
    ItemsModule,
    StatisticsModule,
    UserModule,
    MixModule,
  ],
})
export class AppModule {}
