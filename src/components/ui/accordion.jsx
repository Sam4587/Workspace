import * as React from "react"
import { cn } from "../../lib/utils"

const Accordion = React.forwardRef(({ className, type = "single", collapsible = true, children, ...props }, ref) => {
  const [openValue, setOpenValue] = React.useState("")
  
  return (
    <div ref={ref} className={cn("space-y-1", className)} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          openValue,
          onValueChange: setOpenValue,
          type,
          collapsible
        })
      )}
    </div>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, openValue, onValueChange, children, ...props }, ref) => {
  const isOpen = openValue === value
  
  return (
    <div
      ref={ref}
      className={cn("border-b", className)}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          value,
          isOpen,
          onToggle: () => onValueChange(isOpen ? "" : value)
        })
      )}
    </div>
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, isOpen, onToggle, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    )}
    onClick={onToggle}
    data-state={isOpen ? "open" : "closed"}
    {...props}
  >
    {children}
  </button>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, isOpen, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    data-state={isOpen ? "open" : "closed"}
    {...props}
  >
    <div className="pb-4 pt-0">
      {children}
    </div>
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
