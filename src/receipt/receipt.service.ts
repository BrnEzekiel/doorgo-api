import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
// import * as htmlPdf from 'html-pdf'; // Placeholder for HTML to PDF conversion library

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async generateAndUploadReceipt(
    rentPaymentId: string,
    amountPaid: number,
    tenantName: string,
    hostelName: string,
    roomNumber: string,
    paymentDate: Date,
  ): Promise<string> {
    const receiptHtml = this.generateReceiptHtml({
      rentPaymentId,
      amountPaid,
      tenantName,
      hostelName,
      roomNumber,
      paymentDate,
    });

    // --- Placeholder for HTML to PDF conversion ---
    // In a real application, you would use a library like html-pdf, puppeteer, or a dedicated PDF API
    // const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    //   htmlPdf.create(receiptHtml, {}).toBuffer((err, buffer) => {
    //     if (err) return reject(err);
    //     resolve(buffer);
    //   });
    // });
    // For demonstration, we'll assume a PDF buffer is generated.
    const pdfBuffer = Buffer.from(`Simulated PDF content for receipt ${rentPaymentId}`);
    // --- End Placeholder ---

    // Upload PDF to Cloudinary
    const result = await this.cloudinaryService.uploadFileFromBuffer(
      pdfBuffer,
      `receipts/${rentPaymentId}.pdf`,
      'raw', // Changed to 'raw' as PDFs are not 'image', 'video'
    );

    return result.secure_url;
  }

  private generateReceiptHtml(data: {
    rentPaymentId: string;
    amountPaid: number;
    tenantName: string;
    hostelName: string;
    roomNumber: string;
    paymentDate: Date;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Rent Receipt</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { width: 80%; margin: auto; padding: 20px; border: 1px solid #eee; }
              .header { text-align: center; margin-bottom: 20px; }
              .details p { margin: 5px 0; }
              .footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #666; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Rent Receipt - DoorGo</h2>
                  <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="details">
                  <p><strong>Receipt ID:</strong> ${data.rentPaymentId}</p>
                  <p><strong>Tenant Name:</strong> ${data.tenantName}</p>
                  <p><strong>Hostel Name:</strong> ${data.hostelName}</p>
                  <p><strong>Room Number:</strong> ${data.roomNumber}</p>
                  <p><strong>Payment Date:</strong> ${data.paymentDate.toLocaleDateString()}</p>
                  <p><strong>Amount Paid:</strong> KES ${data.amountPaid.toLocaleString()}</p>
              </div>
              <div class="footer">
                  <p>Thank you for your payment.</p>
                  <p>DoorGo Management</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}
