'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 12人のアシスタント用カラーパレット
const ASSISTANT_COLORS = [
  { bg: '#FF6B6B', text: '#fff' },
  { bg: '#4ECDC4', text: '#fff' },
  { bg: '#45B7D1', text: '#fff' },
  { bg: '#96CEB4', text: '#fff' },
  { bg: '#FFEAA7', text: '#333' },
  { bg: '#DDA0DD', text: '#fff' },
  { bg: '#98D8C8', text: '#333' },
  { bg: '#F7DC6F', text: '#333' },
  { bg: '#BB8FCE', text: '#fff' },
  { bg: '#85C1E9', text: '#fff' },
  { bg: '#F8B500', text: '#fff' },
  { bg: '#82E0AA', text: '#333' },
]

type ViewType = 'month' | 'week' | 'day'

interface Assistant {
  id: string
  name: string
}

interface Reservation {
  id: string
  assistant_id: string
  student_id: string
  location_id: string
  reservation_date: string
  reservation_time: string
  status: string
  notes: string
}

interface Student {
  id: string
  name: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('week')
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [currentDate, viewType])

  const fetchData = async () => {
    setIsLoading(true)
    
    const { data: assistantsData } = await supabase
      .from('assistants')
      .select('id, name')
      .order('name')
    
    if (assistantsData) {
      setAssistants(assistantsData)
      if (selectedAssistants.length === 0) {
        setSelectedAssistants(assistantsData.map(a => a.id))
      }
    }

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, name')
    
    if (studentsData) {
      setStudents(studentsData)
    }

    const { startDate, endDate } = getDateRange()
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('*')
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
    
    if (reservationsData) {
      setReservations(reservationsData)
    }

    setIsLoading(false)
  }

  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (viewType === 'month') {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    } else if (viewType === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      end.setDate(end.getDate() + (6 - day))
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }

  const getAssistantColor = (assistantId: string) => {
    const index = assistants.findIndex(a => a.id === assistantId)
    return ASSISTANT_COLORS[index % ASSISTANT_COLORS.length]
  }

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.name || '未登録'
  }

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const toggleAssistant = (assistantId: string) => {
    setSelectedAssistants(prev => 
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    )
  }

  const selectAllAssistants = () => {
    setSelectedAssistants(assistants.map(a => a.id))
  }

  const deselectAllAssistants = () => {
    setSelectedAssistants([])
  }

  const formatDateHeader = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    if (viewType === 'month') {
      return `${year}年${month}月`
    } else if (viewType === 'week') {
      const start = new Date(currentDate)
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
    } else {
      return `${year}年${month}月${currentDate.getDate()}日`
    }
  }

  const timeSlots = []
  for (let hour = 10; hour < 18; hour++) {
    for (let min = 0; min < 60; min += 5) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
    }
  }
  timeSlots.push('18:00')

  const getWeekDates = () => {
    const dates = []
    const start = new Date(currentDate)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getMonthDates = () => {
    const dates = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getReservationsForDateAndTime = (date: string, time: string) => {
    return reservations.filter(r => 
      r.reservation_date === date && 
      r.reservation_time === time &&
      selectedAssistants.includes(r.assistant_id)
    )
  }

  const getReservationsForDate = (date: string) => {
    return reservations.filter(r => 
      r.reservation_date === date &&
      selectedAssistants.includes(r.assistant_id)
    )
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              📅 BIBIMAKE 予約カレンダー
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewType === view
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {view === 'month' ? '月' : view === 'week' ? '週' : '日'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  今日
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <span className="text-lg font-semibold text-slate-700 min-w-[200px] text-center">
                {formatDateHeader()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">アシスタント</h2>
            <div className="flex gap-1">
              <button
                onClick={selectAllAssistants}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                全選択
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAllAssistants}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                解除
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {assistants.map((assistant, index) => {
              const color = ASSISTANT_COLORS[index % ASSISTANT_COLORS.length]
              const isSelected = selectedAssistants.includes(assistant.id)
              
              return (
                <label
                  key={assistant.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-slate-50' : 'opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAssistant(assistant.id)}
                    className="sr-only"
                  />
                  <span
                className="w-4 h-4 rounded-full flex-shrink-0 transition-all"
                  style={{
  backgroundColor: isSelected ? color.bg : 'transparent',
  boxShadow: `0 0 0 2px white, 0 0 0 4px ${color.bg}`,
}}
                  />
                  <span className={`text-sm ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                    {assistant.name}
                  </span>
                </label>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-medium text-slate-500 mb-2">ステータス</h3>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                確定
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                仮予約
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                キャンセル
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : (
            <>
              {viewType === 'week' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-8 border-b border-slate-200">
                    <div className="p-3 bg-slate-50 border-r border-slate-200"></div>
                    {getWeekDates().map((date, i) => {
                      const isToday = formatDate(date) === formatDate(new Date())
                      return (
                        <div
                          key={i}
                          className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                            isToday ? 'bg-blue-50' : 'bg-slate-50'
                          }`}
                        >
                          <div className={`text-xs ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                            {dayNames[i]}
                          </div>
                          <div className={`text-lg font-semibold ${
                            isToday ? 'text-blue-600' : 'text-slate-800'
                          }`}>
                            {date.getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    {timeSlots.filter((_, i) => i % 6 === 0).map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b border-slate-100 last:border-b-0">
                        <div className="p-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200 text-right pr-3">
                          {time}
                        </div>
                        {getWeekDates().map((date, dayIndex) => {
                          const dateStr = formatDate(date)
                          const dayReservations = getReservationsForDateAndTime(dateStr, time + ':00')
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`min-h-[60px] p-1 border-r border-slate-100 last:border-r-0 ${
                                dayIndex === 0 ? 'bg-red-50/30' : dayIndex === 6 ? 'bg-blue-50/30' : ''
                              }`}
                            >
                              {dayReservations.map((res) => {
                                const color = getAssistantColor(res.assistant_id)
                                const assistant = assistants.find(a => a.id === res.assistant_id)
                                return (
                                  <div
                                    key={res.id}
                                    className="text-xs p-1 rounded mb-1 truncate cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: color.bg, color: color.text }}
                                    title={`${assistant?.name} - ${getStudentName(res.student_id)}`}
                                  >
                                    {assistant?.name}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewType === 'day' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    {timeSlots.map((time, index) => {
                      const dateStr = formatDate(currentDate)
                      const timeReservations = getReservationsForDateAndTime(dateStr, time + ':00')
                      const showHourLabel = index % 12 === 0
                      
                      return (
                        <div
                          key={time}
                          className={`grid grid-cols-[80px_1fr] border-b border-slate-100 ${
                            showHourLabel ? 'border-slate-200' : ''
                          }`}
                        >
                          <div className={`p-2 text-right pr-3 border-r border-slate-200 ${
                            showHourLabel ? 'text-sm text-slate-700 font-medium' : 'text-xs text-slate-400'
                          }`}>
                            {time}
                          </div>
                          <div className="min-h-[32px] p-1 flex flex-wrap gap-1">
                            {timeReservations.map((res) => {
                              const color = getAssistantColor(res.assistant_id)
                              const assistant = assistants.find(a => a.id === res.assistant_id)
                              return (
                                <div
                                  key={res.id}
                                  className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: color.bg, color: color.text }}
                                >
                                  {assistant?.name} - {getStudentName(res.student_id)}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {viewType === 'month' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-slate-200">
                    {dayNames.map((day, i) => (
                      <div
                        key={day}
                        className={`p-3 text-center text-sm font-medium ${
                          i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'
                        } bg-slate-50`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7">
                    {getMonthDates().map((date, index) => {
                      const dateStr = formatDate(date)
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                      const isToday = dateStr === formatDate(new Date())
                      const dayReservations = getReservationsForDate(dateStr)
                      const dayOfWeek = index % 7
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-2 border-b border-r border-slate-100 ${
                            !isCurrentMonth ? 'bg-slate-50/50' : ''
                          } ${dayOfWeek === 0 ? 'bg-red-50/30' : dayOfWeek === 6 ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`text-sm mb-1 ${
                            isToday
                              ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center'
                              : isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayReservations.slice(0, 3).map((res) => {
                              const color = getAssistantColor(res.assistant_id)
                              const assistant = assistants.find(a => a.id === res.assistant_id)
                              return (
                                <div
                                  key={res.id}
                                  className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: color.bg, color: color.text }}
                                  title={`${res.reservation_time} ${assistant?.name}`}
                                >
                                  {res.reservation_time.slice(0, 5)} {assistant?.name}
                                </div>
                              )
                            })}
                            {dayReservations.length > 3 && (
                              <div className="text-xs text-slate-500 pl-1">
                                +{dayReservations.length - 3}件
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
