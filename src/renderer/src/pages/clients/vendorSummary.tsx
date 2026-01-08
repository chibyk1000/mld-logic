import { VendorSummaryPage } from "@renderer/components/vendor-summary"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"


const VendorSummary = () => {
    const [vendorSummary, setVendorSummary] = useState<any>(null)
    // Open vendor summary drawer
       const { id } = useParams()
      const loadVendorSummary = async (vendorId: string) => {
        try {
       
          const res = await window.api.getVendorSummary(vendorId)
          if (res.error) {
            toast.error(res.error)
            return
          }
          setVendorSummary(res.data)
 
        } catch (err) {
          console.error(err)
          toast.error('Failed to load vendor details')
        }
      }
    
    useEffect(() => {
     loadVendorSummary(id as string)
 },[id])
  return (
    <div>
          <VendorSummaryPage loadClients={() => {
              loadVendorSummary(id as string)
          }} vendorId={ id as string} vendorSummary={vendorSummary} />
    </div>
  )
}

export default VendorSummary
