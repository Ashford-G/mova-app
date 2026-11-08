
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  MapPin,
  Search,
  Store,
  Tag,
} from 'lucide-react'

import {
  loadPriceReports,
  createPriceReport,
  type PriceReport,
} from '@/lib/mova-data'

const categories = [
  'Groceries',
  'Electronics',
  'Household',
  'Fuel',
  'Transport',
  'Health & Beauty',
  'Building materials',
  'Clothing',
  'Other',
]

const currencies = ['USD', 'ZAR', 'ZWG', 'BWP']

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function getReportAge(date: string) {
  const days = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (!Number.isFinite(days) || days < 0) {
    return { label: 'Date unavailable', style: 'text-slate-500' }
  }

  if (days <= 7) {
    return { label: 'Recent report', style: 'text-emerald-300' }
  }

  if (days <= 30) {
    return { label: 'Older report', style: 'text-amber-300' }
  }

  return { label: 'Outdated report', style: 'text-rose-300' }
}

export function MovaPricePanel({
  userId,
  currency,
}: {
  userId: string
  currency: string
}) {
  const [reports, setReports] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [merchantName, setMerchantName] = useState('')
  const [price, setPrice] = useState('')
  const [reportCurrency, setReportCurrency] = useState(
    currencies.includes(currency) ? currency : 'USD'
  )
  const [location, setLocation] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchReports() {
      setLoading(true)
      setMessage('')

      try {
        const result = await loadPriceReports(userId)

        if (!cancelled) {
          setReports(result)
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Could not load price reports.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchReports()

    return () => {
      cancelled = true
    }
  }, [userId])

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return reports

    return reports.filter(report =>
      report.productName.toLowerCase().includes(term) ||
      report.category.toLowerCase().includes(term) ||
      report.merchantName.toLowerCase().includes(term) ||
      (report.location || '').toLowerCase().includes(term)
    )
  }, [reports, search])

  const lowestPrices = useMemo(() => {
    const lowest = new Map<string, number>()

    for (const report of filteredReports) {
      const key = `${report.productName.trim().toLowerCase()}-${report.currency}`

      const current = lowest.get(key)

      if (current === undefined || report.price < current) {
        lowest.set(key, report.price)
      }
    }

    return lowest
  }, [filteredReports])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    const numericPrice = Number(price)

    if (!productName.trim()) {
      setMessage('Enter the product name.')
      return
    }

    if (!merchantName.trim()) {
      setMessage('Enter the shop or seller name.')
      return
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setMessage('Enter a price greater than zero.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const report = await createPriceReport(userId, {
        productName,
        category,
        merchantName,
        price: numericPrice,
        currency: reportCurrency,
        location,
      })

      setReports(current => [report, ...current])
      setProductName('')
      setMerchantName('')
      setPrice('')
      setLocation('')
      setMessage('Your price report has been submitted. Thank you!')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not submit this price report.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-200">
          <Tag size={18} />
          <span className="text-xs font-semibold tracking-wider">
            COMMUNITY PRICE GUIDE
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          Compare before you buy.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Explore prices reported by other MOVA users and share prices you
          have found. These are community reports, not live market prices.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-[#142c36] to-[#111b2b] p-5">
          <p className="text-xs text-emerald-100/70">
            PRICE REPORTS AVAILABLE
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {loading ? '...' : reports.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Latest reports currently loaded
          </p>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-white/[.03] p-5">
          <p className="text-xs text-slate-400">YOUR ROLE</p>
          <p className="mt-3 text-lg font-semibold">
            Help the community save.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Share a price you have personally seen so others can compare.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search products, categories, shops or locations..."
          className="w-full rounded-xl border border-white/10 bg-[#0b1422] py-4 pl-11 pr-4 text-sm text-white outline-none focus:border-emerald-300/50"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-white/[.08] bg-[#101a29] p-5 md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Report a price</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Enter a price you have seen at a shop or seller.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Product name
              </label>
              <input
                required
                value={productName}
                onChange={event => setProductName(event.target.value)}
                placeholder="e.g. 2L cooking oil"
                className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Category
              </label>
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none"
              >
                {categories.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Shop or seller
              </label>
              <input
                required
                value={merchantName}
                onChange={event => setMerchantName(event.target.value)}
                placeholder="e.g. Local supermarket"
                className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
              />
            </div>

            <div className="grid grid-cols-[1fr_105px] gap-3">
              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Price
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-400">
                  Currency
                </label>
                <select
                  value={reportCurrency}
                  onChange={event => setReportCurrency(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-3 py-3 text-sm text-white outline-none"
                >
                  {currencies.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Location (optional)
              </label>
              <input
                value={location}
                onChange={event => setLocation(event.target.value)}
                placeholder="e.g. Harare, CBD"
                className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07121b] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Submitting report...' : 'Submit price report'}
            </button>

            {message && (
              <p
                role="status"
                className="text-xs leading-5 text-slate-300"
              >
                {message}
              </p>
            )}
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Reported prices</h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredReports.length} matching reports
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/[.07] p-10 text-center text-sm text-slate-500">
              Loading community prices...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <Search className="mx-auto mb-3 text-slate-500" size={25} />
              <p className="text-sm font-medium text-slate-300">
                No matching price reports
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Try another search or be the first to report this product.
              </p>
            </div>
          ) : (
            filteredReports.map(report => {
              const key = `${report.productName.trim().toLowerCase()}-${report.currency}`
              const isLowest = report.price === lowestPrices.get(key)
              const age = getReportAge(report.reportedAt)

              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-white/[.08] bg-[#101a29] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold">
                        {report.productName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {report.category}
                      </p>
                    </div>

                    {isLowest && (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold text-emerald-200">
                        Lowest reported
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Reported price</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatPrice(report.price, report.currency)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Seller</p>
                      <p className="mt-1 max-w-[150px] truncate text-sm font-medium">
                        {report.merchantName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[.07] pt-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </span>

                    {report.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {report.location}
                      </span>
                    )}

                    <span className={`flex items-center gap-1.5 ${age.style}`}>
                      <AlertCircle size={13} />
                      {age.label}
                    </span>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Store size={12} />
                    {report.verified
                      ? 'Verified report'
                      : 'Community-submitted · not verified'}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      <p className="text-[11px] leading-5 text-slate-500">
        MOVA Price is a community price guide, not a live price feed. Reports
        may be outdated or inaccurate. Confirm the current price with the
        seller before purchasing. Lowest-price comparisons only apply to
        matching product names and the same currency.
      </p>
    </div>
  )
}
