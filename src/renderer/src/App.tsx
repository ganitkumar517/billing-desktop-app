import { useEffect } from 'react'
import { Mark } from './components/Mark'
import { Shell } from './components/Shell'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { bootstrap } from './store/invoiceSlice'

export default function App() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.invoice.status)
  const bootError = useAppSelector((state) => state.invoice.bootError)

  useEffect(() => {
    void dispatch(bootstrap())
  }, [dispatch])

  if (status === 'failed') {
    return (
      <div className="grid h-screen place-items-center bg-paper px-8 text-center text-ink">
        <div>
          <Mark className="mx-auto mb-6 h-36 w-36" />
          <p>{bootError}</p>
        </div>
      </div>
    )
  }

  if (status !== 'ready') {
    return (
      <div className="grid h-screen place-items-center bg-paper text-ink">
        <Mark className="h-44 w-44" />
      </div>
    )
  }

  return <Shell />
}
