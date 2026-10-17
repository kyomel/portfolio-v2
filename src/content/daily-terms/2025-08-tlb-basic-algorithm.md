---
title: "TLB Basic Algorithm"
termSlug: "tlb-basic-algorithm"
year: 2025
month: 8
monthName: "August"
day: 7
order: 8
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "The TLB (Translation Lookaside Buffer) Basic Algorithm handles virtual-to-physical memory address translation by first checking the TLB (a fast, small cache). If the page number is found (TLB hit),..."
---
### Definition:

The TLB (Translation Lookaside Buffer) Basic Algorithm handles virtual-to-physical memory address translation by first checking the TLB (a fast, small cache). If the page number is found (TLB hit), the frame number is retrieved quickly; if not (TLB miss), the address is resolved via page tables, and the translation is then updated in the TLB for future accesses.

### Example:

```
VPN = (VirtualAddress & VPN_MASK) >> SHIFT
(Success, TlbEntry) = TLB_Lookup(VPN)
if (Success == True)   // TLB Hit
    if (CanAccess(TlbEntry.ProtectBits) == True)
        Offset   = VirtualAddress & OFFSET_MASK
        PhysAddr = (TlbEntry.PFN << SHIFT) | Offset
        Register = AccessMemory(PhysAddr)
    else
        RaiseException(PROTECTION_FAULT)
else                  // TLB Miss
    PTEAddr = PTBR + (VPN * sizeof(PTE))
    PTE = AccessMemory(PTEAddr)
    if (PTE.Valid == False)
        RaiseException(SEGMENTATION_FAULT)
    else if (CanAccess(PTE.ProtectBits) == False)
        RaiseException(PROTECTION_FAULT)
    else
        TLB_Insert(VPN, PTE.PFN, PTE.ProtectBits)
        RetryInstruction()
```

The algorithm the hardware follows works like this: first, extract the virtual page number (VPN) from the virtual address (Line 1 in the code snippet above), and check if the TLB holds the translation for this VPN (Line 2). If it does, we have a TLB hit, which means the TLB holds the translation. Success! We can now extract the page frame number (PFN) from the relevant TLB entry, concatenate that onto the offset from the original virtual address, and form the desired physical address (PA), and access memory (Lines 5–7), assuming protection checks do not fail (Line 4).
