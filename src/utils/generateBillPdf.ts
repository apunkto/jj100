import type {BillData} from '@/src/api/useBillApi'
import {moneyToEstonianWords} from '@/src/utils/estonianMoneyWords'

export async function generateBillPdf(bill: BillData): Promise<void> {
    const {default: jsPDF} = await import('jspdf')

    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()

    const leftMargin = 20
    const rightMargin = pageW - 20
    let y = 25

    const lineHeight = 6
    const smallLineHeight = 5

    // --- Title ---
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`ARVE nr. ${bill.billNumber}`, leftMargin, y)
    y += lineHeight + 2

    // --- Date ---
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(bill.issueDate, leftMargin, y)
    y += lineHeight * 2

    // --- Issuer block ---
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(bill.issuer.name, leftMargin, y)
    y += smallLineHeight

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(bill.issuer.address, leftMargin, y)
    y += smallLineHeight
    pdf.text(`Reg. ${bill.issuer.regCode}`, leftMargin, y)
    y += smallLineHeight
    pdf.text(`tel. ${bill.issuer.phone}`, leftMargin, y)
    y += smallLineHeight
    pdf.text(`${bill.issuer.bankName} a/a ${bill.issuer.iban}`, leftMargin, y)
    y += lineHeight * 2

    // --- Payer ---
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Maksja:', leftMargin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(bill.payerName, leftMargin + 22, y)
    y += lineHeight * 2.5

    // --- Table header ---
    const colNimetus = leftMargin
    const colKogus = 120
    const colHind = 145
    const colSumma = 170

    pdf.setDrawColor(0)
    pdf.setLineWidth(0.3)
    pdf.line(leftMargin, y, rightMargin, y)
    y += smallLineHeight

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Nimetus', colNimetus, y)
    pdf.text('Kogus', colKogus, y, {align: 'right'})
    pdf.text('Hind', colHind, y, {align: 'right'})
    pdf.text('Summa', colSumma, y, {align: 'right'})
    y += 2
    pdf.line(leftMargin, y, rightMargin, y)
    y += smallLineHeight + 1

    // --- Table row ---
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(bill.description, colKogus - colNimetus - 10)
    for (const line of descLines) {
        pdf.text(line, colNimetus, y)
        y += smallLineHeight
    }

    const priceStr = `${formatPrice(bill.unitPrice)} \u20AC`
    const totalStr = `${formatPrice(bill.total)} \u20AC`

    pdf.text(String(bill.quantity), colKogus, y - smallLineHeight, {align: 'right'})
    pdf.text(priceStr, colHind, y - smallLineHeight, {align: 'right'})
    pdf.text(totalStr, colSumma, y - smallLineHeight, {align: 'right'})

    y += 2
    pdf.line(leftMargin, y, rightMargin, y)
    y += smallLineHeight + 2

    // --- Total ---
    pdf.setFont('helvetica', 'bold')
    pdf.text('Kogusumma', colNimetus, y)
    pdf.text(`${formatPrice(bill.total)} \u20AC`, colSumma, y, {align: 'right'})
    y += lineHeight * 1.2

    const sumWords = moneyToEstonianWords(bill.total)
    if (sumWords) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        const sumLine = `Summa s\u00f5nadega: ${sumWords}`
        const sumLines = pdf.splitTextToSize(sumLine, rightMargin - leftMargin)
        for (const line of sumLines) {
            pdf.text(line, leftMargin, y)
            y += smallLineHeight
        }
        y += lineHeight * 0.8
    } else {
        y += lineHeight * 1.3
    }

    // --- Due date ---
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`Makset\u00e4htaeg: ${bill.dueDate}`, leftMargin, y)
    y += lineHeight * 2.5

    // --- Signatory ---
    pdf.text(`Juhatuse liige: ${bill.signatory}`, leftMargin, y)

    pdf.save(`arve-${bill.billNumber}.pdf`)
}

function formatPrice(value: string): string {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toFixed(2).replace('.', ',')
}
