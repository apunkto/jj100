import type {BillData} from '@/src/api/useBillApi'
import {moneyToEstonianWords} from '@/src/utils/estonianMoneyWords'
import i18n from '@/src/i18n/i18n'

/** Invoices are always generated in Estonian (legal / issuer copy). */
export async function generateBillPdf(bill: BillData): Promise<void> {
    const {default: jsPDF} = await import('jspdf')

    const t = i18n.getFixedT('et', 'pdf')

    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()

    const leftMargin = 20
    const rightMargin = pageW - 20
    let y = 25

    const lineHeight = 6
    const smallLineHeight = 5

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(t('invoiceTitle', {number: bill.billNumber}), leftMargin, y)
    y += lineHeight + 2

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(bill.issueDate, leftMargin, y)
    y += lineHeight * 2

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(bill.issuer.name, leftMargin, y)
    y += smallLineHeight

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(bill.issuer.address, leftMargin, y)
    y += smallLineHeight
    pdf.text(`${t('reg')} ${bill.issuer.regCode}`, leftMargin, y)
    y += smallLineHeight
    pdf.text(`${t('tel')} ${bill.issuer.phone}`, leftMargin, y)
    y += smallLineHeight
    pdf.text(t('bankIban', {bank: bill.issuer.bankName, iban: bill.issuer.iban}), leftMargin, y)
    y += lineHeight * 2

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(t('payer'), leftMargin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(bill.payerName, leftMargin + 22, y)
    y += lineHeight * 2.5

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
    pdf.text(t('colDescription'), colNimetus, y)
    pdf.text(t('colQty'), colKogus, y, {align: 'right'})
    pdf.text(t('colPrice'), colHind, y, {align: 'right'})
    pdf.text(t('colSum'), colSumma, y, {align: 'right'})
    y += 2
    pdf.line(leftMargin, y, rightMargin, y)
    y += smallLineHeight + 1

    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(bill.description, colKogus - colNimetus - 10)
    for (const line of descLines) {
        pdf.text(line, colNimetus, y)
        y += smallLineHeight
    }

    const priceStr = `${formatPriceEt(bill.unitPrice)} \u20AC`
    const totalStr = `${formatPriceEt(bill.total)} \u20AC`

    pdf.text(String(bill.quantity), colKogus, y - smallLineHeight, {align: 'right'})
    pdf.text(priceStr, colHind, y - smallLineHeight, {align: 'right'})
    pdf.text(totalStr, colSumma, y - smallLineHeight, {align: 'right'})

    y += 2
    pdf.line(leftMargin, y, rightMargin, y)
    y += smallLineHeight + 2

    pdf.setFont('helvetica', 'bold')
    pdf.text(t('total'), colNimetus, y)
    pdf.text(`${formatPriceEt(bill.total)} \u20AC`, colSumma, y, {align: 'right'})
    y += lineHeight * 1.2

    const sumWords = moneyToEstonianWords(bill.total)
    if (sumWords) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        const sumLine = t('amountInWords', {words: sumWords})
        const sumLines = pdf.splitTextToSize(sumLine, rightMargin - leftMargin)
        for (const line of sumLines) {
            pdf.text(line, leftMargin, y)
            y += smallLineHeight
        }
        y += lineHeight * 0.8
    } else {
        y += lineHeight * 1.3
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(t('dueDate', {date: bill.dueDate}), leftMargin, y)
    y += lineHeight * 2.5

    pdf.text(t('boardMember', {name: bill.signatory}), leftMargin, y)

    pdf.save(t('filename', {number: bill.billNumber}))
}

function formatPriceEt(value: string): string {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toFixed(2).replace('.', ',')
}
