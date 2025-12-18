import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    return this.prisma.invoice.create({ data: createInvoiceDto });
  }

  findAll() {
    return this.prisma.invoice.findMany({
      include: {
        booking: {
          include: {
            leadTenant: true,
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
      },
    });
  }

  findByTenantId(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: {
        booking: {
          leadTenantId: tenantId,
        },
      },
      include: {
        booking: {
          include: {
            leadTenant: true,
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
      },
    });
  }

  findByLandlordId(landlordId: string) {
    return this.prisma.invoice.findMany({
      where: {
        booking: {
          room: {
            hostel: {
              ownerId: landlordId,
            },
          },
        },
      },
      include: {
        booking: {
          include: {
            leadTenant: true,
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            leadTenant: true,
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
      },
    });
  }

  update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    return this.prisma.invoice.update({
      where: { id },
      data: updateInvoiceDto,
    });
  }

  remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
