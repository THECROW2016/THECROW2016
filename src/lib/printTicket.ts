import { Visit, Patient, Department } from './api';

export function printTicket(visit: Visit, patient: Patient, department?: Department | null) {
  // Create a printable ticket
  const ticketContent = `
    <html>
    <head>
      <title>Ticket ${visit.ticket_number}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 76mm;
          padding: 2mm;
          margin: 0;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .hospital-name {
          font-size: 16px;
          font-weight: bold;
        }
        .ticket-number {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          letter-spacing: 4px;
        }
        .info {
          margin: 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        .patient-name {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0;
        }
        .department {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          padding: 8px;
          border: 1px dashed #000;
          margin: 8px 0;
        }
        .priority {
          text-align: center;
          padding: 4px;
          margin: 8px 0;
        }
        .priority.urgent { background: #ffe0e0; }
        .priority.high { background: #fff0e0; }
        .footer {
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 10px;
        }
        .date {
          text-align: center;
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-name">HOSPITAL MANAGEMENT</div>
        <div>Patient Ticket</div>
      </div>

      <div class="ticket-number">${visit.ticket_number}</div>

      <div class="patient-name">${patient.first_name} ${patient.last_name}</div>

      <div class="info">
        <div class="info-row">
          <span>MRN:</span>
          <span>${patient.medical_record_number}</span>
        </div>
        ${patient.date_of_birth ? `
        <div class="info-row">
          <span>DOB:</span>
          <span>${new Date(patient.date_of_birth).toLocaleDateString()}</span>
        </div>
        ` : ''}
        ${patient.phone ? `
        <div class="info-row">
          <span>Phone:</span>
          <span>${patient.phone}</span>
        </div>
        ` : ''}
      </div>

      ${department ? `
      <div class="department">
        Proceed to: ${department.name}
      </div>
      ` : ''}

      <div class="priority ${visit.priority}">
        Priority: ${visit.priority.toUpperCase()}
      </div>

      ${visit.chief_complaint ? `
      <div class="info">
        <div style="font-size: 10px;">Complaint: ${visit.chief_complaint.slice(0, 50)}${visit.chief_complaint.length > 50 ? '...' : ''}</div>
      </div>
      ` : ''}

      <div class="date">
        ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </div>

      <div class="footer">
        <div>Please keep this ticket</div>
        <div>Wait for your number to be called</div>
      </div>
    </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(ticketContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  } else {
    alert('Please enable popups to print tickets');
  }
}

export function quickPrintTicket(visit: Visit) {
  const ticketContent = `
    <html>
    <head>
      <title>Queue Ticket</title>
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 76mm; padding: 4mm; margin: 0; text-align: center; }
        .ticket { font-size: 48px; font-weight: bold; margin: 20px 0; letter-spacing: 4px; }
        .info { margin: 10px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div>HOSPITAL QUEUE</div>
      <div class="ticket">${visit.ticket_number}</div>
      <div class="info">${new Date().toLocaleDateString()}</div>
      <div class="info">${new Date().toLocaleTimeString()}</div>
      <div style="margin-top: 20px; font-size: 10px;">Keep this ticket</div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=300,height=400');
  if (printWindow) {
    printWindow.document.write(ticketContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}
