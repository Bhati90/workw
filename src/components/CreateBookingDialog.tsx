interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: {
    farmerId?: string;
    farmerName?: string;
    activityTypeId?: string;
    activityName?: string;
    requestedDate?: string;
  };
}


// In the component, initialize state with prefilled data
export function CreateBookingDialog({ 
  open, 
  onOpenChange, 
  prefilledData 
}: CreateBookingDialogProps) {
  const [farmerId, setFarmerId] = useState(prefilledData?.farmerId || "");
  const [activityTypeId, setActivityTypeId] = useState(prefilledData?.activityTypeId || "");
  const [requestedDate, setRequestedDate] = useState<Date | undefined>(
    prefilledData?.requestedDate ? new Date(prefilledData.requestedDate) : undefined
  );
  
  // ... rest of component
  
  // When dialog opens, set prefilled values
//   useEffect(() => {
//     if (open && prefilledData) {
//       setFarmerId(prefilledData.farmerId || "");
//       setActivityTypeId(prefilledData.activityTypeId || "");
//       if (prefilledData.requestedDate) {
//         setRequestedDate(new Date(prefilledData.requestedDate));
//       }
//     }
//   }, [open, prefilledData]);
}