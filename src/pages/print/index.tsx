// src/pages/print/index.tsx
import HoleCard from "@/src/components/HoleCard"
import useCtpApi, {Hole} from "@/src/api/useCtpApi"
import {useEffect, useRef, useState} from "react"
import {Box, Button} from "@mui/material"
import jsPDF from "jspdf"

export default function PrintHolesPage() {
    const { getHoles } = useCtpApi()
    const [holes, setHoles] = useState<Hole[] | null>(null)

    // one DOM ref per card wrapper
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const fetchHoles = async () => {
            const res = await getHoles()
            setHoles(res?.map((r) => r.hole) ?? [])
        }
        fetchHoles()
    }, [getHoles])

    const exportPdf = async () => {
        if (!holes?.length) return

        // ✅ wait until your @font-face Poppins is fully loaded
        if (typeof document !== "undefined" && (document as any).fonts?.ready) {
            await (document as any).fonts.ready
            try {
                await Promise.all([
                    (document as any).fonts.load('400 16px "Poppins"'),
                    (document as any).fonts.load('500 16px "Poppins"'),
                    (document as any).fonts.load('600 16px "Poppins"'),
                    (document as any).fonts.load('700 16px "Poppins"'),
                    (document as any).fonts.load('800 16px "Poppins"'),
                    (document as any).fonts.load('900 16px "Poppins"'),
                ])
            } catch {
                // ignore
            }
        }

        // ✅ dynamic import to avoid SSR issues
        const html2canvas = (await import("html2canvas")).default

        // A4 portrait in mm
        const pdf = new jsPDF("portrait", "mm", "a4")
        const pageW = pdf.internal.pageSize.getWidth() // 210
        const pageH = pdf.internal.pageSize.getHeight() // 297

        // ✅ margin around card in PDF (mm)
        const margin = 10
        const availW = pageW - margin * 2
        const availH = pageH - margin * 2

        // your card aspect ratio
        const cardAR = 5 / 7

        // compute consistent draw size from ratio
        let drawW = availW
        let drawH = drawW / cardAR
        if (drawH > availH) {
            drawH = availH
            drawW = drawH * cardAR
        }
        const x = (pageW - drawW) / 2
        const y = (pageH - drawH) / 2

        for (let i = 0; i < holes.length; i++) {
            console.log(`Exporting hole ${i + 1} / ${holes.length}`)
            const node = cardRefs.current[i]
            if (!node) continue

            // ✅ force font on capture root (helps if something inherits wrong)
            node.style.fontFamily = '"Poppins", sans-serif'

            const canvas = await html2canvas(node, {
                scale: 3, // sharpness
                backgroundColor: "#ffffff",
                useCORS: true, // important if images/fonts ever come via CDN
                allowTaint: true,
                logging: false,
            })

            const dataUrl = canvas.toDataURL("image/png", 1.0)

            if (i > 0) pdf.addPage()
            pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "FAST")
        }

        pdf.save("holes.pdf")
    }

    if (!holes) return null

    return (
        <Box sx={{ py: 2, fontFamily: '"Poppins", sans-serif' }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, gap: 1 }}>
                <Button variant="contained" onClick={exportPdf}>
                    Download PDF (A4)
                </Button>
            </Box>

            {/* Preview only; we capture each wrapper */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                {holes.map((hole, idx) => {
                    const number = hole?.number ?? idx + 1
                    return (
                        <div
                            key={hole?.id ?? number}
                            ref={(el) => {
                                cardRefs.current[idx] = el
                            }}
                            style={{
                                width: "210mm",
                                height: "294mm",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#fff",
                                overflow: "hidden",
                                fontFamily: '"Poppins", sans-serif',
                            }}
                        >
                            <div style={{ width: "100%", height: "100%" }}>
                                <HoleCard number={number} hole={hole} isPriority={false} maxWidth={1200} />
                            </div>
                        </div>
                    )
                })}
            </Box>
        </Box>
    )
}
