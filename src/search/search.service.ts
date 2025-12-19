import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User as AuthUser } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, user: AuthUser) {
    const searchResults: any = {};

    // Sanitize query for partial matching
    const contains = query.split(' ').join(' & ');

    // Admin can search everything
    if (user.role.includes('admin')) {
      searchResults.users = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains, mode: 'insensitive' } },
            { firstName: { contains, mode: 'insensitive' } },
            { lastName: { contains, mode: 'insensitive' } },
            { phone: { contains, mode: 'insensitive' } },
          ],
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
      searchResults.hostels = await this.prisma.hostel.findMany({
        where: {
          OR: [
            { name: { contains, mode: 'insensitive' } },
            { description: { contains, mode: 'insensitive' } }, // Search nearbyLandmark within description for now
            // Assuming nearbyLandmark is conceptually similar to a location description
          ],
        },
      });
      searchResults.services = await this.prisma.service.findMany({
        where: {
          OR: [
            { name: { contains, mode: 'insensitive' } },
            { description: { contains, mode: 'insensitive' } },
          ],
        },
      });
      // Add other models as needed for admin
    }

    // Landlord can search their hostels, tenants, and related maintenance/leases
    if (user.role.includes('landlord')) {
      const ownedHostels = await this.prisma.hostel.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true },
      });
      const ownedHostelIds = ownedHostels.map(h => h.id);

      searchResults.myHostels = ownedHostels;
      
      searchResults.tenantsInMyHostels = await this.prisma.user.findMany({
        where: {
          AND: [
            { role: { has: 'tenant' } },
            {
              bookings: {
                some: {
                  room: {
                    hostelId: { in: ownedHostelIds },
                  },
                },
              },
            },
            {
              OR: [
                { email: { contains, mode: 'insensitive' } },
                { firstName: { contains, mode: 'insensitive' } },
                { lastName: { contains, mode: 'insensitive' } },
                { phone: { contains, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      searchResults.maintenanceRequests = await this.prisma.maintenanceRequest.findMany({
        where: {
          hostelId: { in: ownedHostelIds },
          OR: [
            { description: { contains, mode: 'insensitive' } },
            { type: { contains, mode: 'insensitive' } },
          ],
        },
      });
      // Add other landlord-specific searches
    }

    // Tenant can search their own bookings, maintenance requests, etc.
    if (user.role.includes('tenant')) {
      searchResults.myBookings = await this.prisma.booking.findMany({
        where: {
          leadTenantId: user.id,
          OR: [
            { room: { roomNumber: { contains, mode: 'insensitive' } } },
          ],
        },
        include: { room: true },
      });

      searchResults.myMaintenanceRequests = await this.prisma.maintenanceRequest.findMany({
        where: {
          userId: user.id,
          OR: [
            { description: { contains, mode: 'insensitive' } },
            { type: { contains, mode: 'insensitive' } },
          ],
        },
      });
      // Add other tenant-specific searches
    }

    // Service Provider can search their services and service bookings
    if (user.role.includes('service_provider')) {
      searchResults.myServices = await this.prisma.service.findMany({
        where: {
          providerId: user.id,
          OR: [
            { name: { contains, mode: 'insensitive' } },
            { description: { contains, mode: 'insensitive' } },
          ],
        },
      });

      // Fetch services first to get service IDs owned by the provider
      const providerServices = await this.prisma.service.findMany({
        where: {
          providerId: user.id,
          OR: [
            { name: { contains, mode: 'insensitive' } },
            { description: { contains, mode: 'insensitive' } },
          ],
        },
        select: { id: true }, // Select only the ID
      });
      const providerServiceIds = providerServices.map(s => s.id);

      searchResults.myServiceBookings = await this.prisma.serviceBooking.findMany({
        where: {
          serviceId: { in: providerServiceIds }, // Filter by service IDs owned by provider
          OR: [
            // Search by tenant details directly on the tenant model
            { tenant: { firstName: { contains, mode: 'insensitive' } } },
            { tenant: { lastName: { contains, mode: 'insensitive' } } },
          ],
        },
        include: { tenant: true }, // Only include tenant now
      });
      // Add other service provider-specific searches
    }

    return searchResults;
  }
}
