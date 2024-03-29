import { ProductService } from './../product/product.service';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { StaffOrderDto } from './dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { user } from '@prisma/client';

@Injectable()
export class StaffOrderService {
  constructor(
    private prismaService: PrismaService,
    private mailerService: MailerService,
    private config: ConfigService,
    private productService: ProductService,
  ) {}

  async isPermission(user: user) {
    const check = this.prismaService.staff.findFirst({
      where: {
        userId: user.id,
        status: 1,
      },
    });

    return (user.role == 'SALES' || user.role == 'ADMIN') && check;
  }

  async updateQuatity(
    productId: number,
    colorId: number,
    size: string,
    quantity_order: number,
  ) {
    const product = this.prismaService.product_detail.findFirst({
      where: {
        productId: productId,
        colorId: colorId,
        size: size,
      },
    });
    const quantity = (await product).quantity;
    const upadated = this.prismaService.product_detail.updateMany({
      where: {
        productId: productId,
        colorId: colorId,
        size: size,
      },
      data: {
        quantity: quantity + quantity_order,
      },
    });
    return upadated;
  }
  async updateOrderStatus(userr: user, orderId: string) {
    if (!(await this.isPermission(userr)))
      throw new ForbiddenException('Permission denied');
    const order = await this.prismaService.order_detail.findUnique({
      where: {
        id: orderId,
      },
    });
    if (order.status < 1 || order.status > 3)
      throw new ForbiddenException("Can't update this order");

    const sta = order.status + 1;
    let updated: any;

    if (sta == 4) {
      updated = await this.prismaService.order_detail.update({
        where: {
          id: orderId,
        },
        data: {
          status: sta,
          completedAt: new Date(),
        },
      });

      const items = await this.prismaService.order_item.findMany({
        where: {
          orderId,
        },
      });
      for (const item of items) {
        const prod = await this.prismaService.product.findUnique({
          where: {
            productId: item.productId,
          },
        });
        await this.prismaService.product.update({
          where: {
            productId: item.productId,
          },
          data: {
            sold: prod.sold + item.quantity,
          },
        });
      }
    } else {
      updated = await this.prismaService.order_detail.update({
        where: {
          id: orderId,
        },
        data: {
          status: sta,
        },
      });
    }

    const customerId = order.customerId;
    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
      },
    });
    const userId = customer.userId;
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    let status_string = '';
    const email = user.email;
    switch (sta) {
      case 1:
        status_string = 'PLACED';
        break;
      case 2:
        status_string = 'PACKING';
        break;
      case 3:
        status_string = 'SHIPPING';
        break;
      case 4:
        status_string = 'COMPLETED';
        break;
    }

    await this.prismaService.customer.update({
      where: {
        id: customerId,
      },
      data: {
        totalPurchaseAmount: customer.totalPurchaseAmount + order.total,
      },
    });

    await this.mailerService.sendMail({
      to: email,
      from: this.config.get('MAIL_FROM'),
      subject: 'Your order be ' + status_string,
      text:
        'Welcome honored guests,' +
        '\n\nKatliaFashion is pleased to announce that your order #' +
        orderId +
        ' has been ' +
        status_string,
    });
    return updated;
  }

  async cancelOrder(user: user, orderId: string, dto: StaffOrderDto) {
    if (!(await this.isPermission(user)))
      throw new ForbiddenException('Permission denied');
    const order = await this.prismaService.order_detail.findUnique({
      where: {
        id: orderId,
      },
    });
    const status = order.status;
    if (status == 1 || status == 2||status==3) {
      const cancel = await this.prismaService.order_detail.update({
        where: {
          id: orderId,
        },
        data: {
          status: 5,
        },
      });
      const getItemOrder = await this.prismaService.order_item.findMany({
        where: {
          orderId: orderId,
        },
      });
      for (const order_item of getItemOrder) {
        this.updateQuatity(
          order_item.productId,
          order_item.colorId,
          order_item.size,
          order_item.quantity,
        );
      }

      const customerId = order.customerId;
      const customer = await this.prismaService.customer.findUnique({
        where: {
          id: customerId,
        },
      });
      const userId = customer.userId;
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      const email = user.email;
      await this.mailerService.sendMail({
        to: email,
        from: this.config.get('MAIL_FROM'),
        subject: 'Your order be Cancel',
        text:
          'Welcome honored guests,' +
          '\n\nKatliaFashion is sorry to announce that your order #' +
          orderId +
          ' has been CANCEL' +
          '\n\nReason: ' +
          dto.cancelReason,
      });

      return cancel;
    } else {
      throw new ForbiddenException("Can't cancel the order!");
    }
  }

  async getAllOrder(user: user) {
    if (!(await this.isPermission(user)))
      throw new ForbiddenException('Permission denied');
    const getAllOrder = await this.prismaService.order_detail.findMany({
      where: {
        OR: [
          {
            status: 1,
          },
          {
            status: 2,
          },
          {
            status: 3,
          },
          {
            status: 4,
          },
          {
            status: 5,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const orderList: any[] = [];
    for (const order of getAllOrder) {
      orderList.push({
        orderId: order.id,
        customerName: order.receiverName,
        customerPhone: order.receiverPhone,
        address: order.address,
        createDate: order.createdAt,
        total: this.productService.formatFloat(order.total),
        status: order.status,
        note: order.note,
      });
    }
    return orderList;
  }
  async getDetailOrder(user: user, orderId: string) {
    if (!(await this.isPermission(user)))
      throw new ForbiddenException('Permission denied');

    const getAllItemOrder = await this.prismaService.order_item.findMany({
      where: {
        orderId: orderId,
      },
      select: {
        id: true,
        orderId: true,
        currentPrice: true,
        productId: true,
        size: true,
        colorId: true,
        quantity: true,
        currentSalesPrice: true,
      },
    });
    const ListItemOrder: any[] = [];
    for (const item of getAllItemOrder) {
      const product = await this.prismaService.product.findUnique({
        where: {
          productId: item.productId,
        },
      });
      const productName = await product.name;
      const color = await this.prismaService.color.findUnique({
        where: {
          colorId: item.colorId,
        },
      });
      const colorOfItem = await color.color;

      ListItemOrder.push({
        productId: item.productId,
        productName: productName,
        color: colorOfItem,
        size: item.size,
        unitPrice:
          item.currentSalesPrice != null && item.currentSalesPrice != 0
            ? this.productService.formatFloat(item.currentSalesPrice)
            : this.productService.formatFloat(item.currentPrice),
        quatity: item.quantity,
        total:
          item.currentSalesPrice != null && item.currentSalesPrice != 0
            ? this.productService.formatFloat(
                item.currentSalesPrice * item.quantity,
              )
            : this.productService.formatFloat(
                item.currentPrice * item.quantity,
              ),
      });
    }

    return ListItemOrder;
  }
  async getPriceOrder(user: user, orderId: string) {
    if (!(await this.isPermission(user)))
      throw new ForbiddenException('Permission denied');
    const getAllItem = await this.prismaService.order_item.findMany({
      where: {
        orderId: orderId,
      },
    });
    let total = 0;
    let discount = 0;

    for (const item of getAllItem) {
      total += item.currentPrice * item.quantity;
      discount += item.currentSalesPrice * item.quantity;
    }
    const order = await this.prismaService.order_detail.findUnique({
      where: {
        id: orderId,
      },
    });
    const shippingFee = order.shippingFee;
    const getprice = {
      total: this.productService.formatFloat(total),
      shippingFee: shippingFee,
      discount: this.productService.formatFloat(discount),
      subtotal: this.productService.formatFloat(total + shippingFee - discount),
    };

    return getprice;
  }
}
