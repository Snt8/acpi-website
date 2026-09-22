import { BraceletDetails } from './sections/BraceletDetails.jsx'
import { BraceletHero } from './sections/BraceletHero.jsx'
import { BraceletNext } from './sections/BraceletNext.jsx'

/** Página del brazalete ACPI V3.0. */
export default function BraceletPage() {
  return (
    <>
      <BraceletHero />
      <BraceletDetails />
      <BraceletNext />
    </>
  )
}
