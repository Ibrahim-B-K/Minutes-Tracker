import React, { useState, useEffect } from 'react';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './CustomDateRangePicker.css';

const defineds = {
  startOfWeek: startOfWeek(new Date()),
  endOfWeek: endOfWeek(new Date()),
  startOfLastWeek: startOfWeek(subDays(new Date(), 7)),
  endOfLastWeek: endOfWeek(subDays(new Date(), 7)),
  startOfToday: new Date(),
  endOfToday: new Date(),
  startOfYesterday: subDays(new Date(), 1),
  endOfYesterday: subDays(new Date(), 1),
  startOfMonth: startOfMonth(new Date()),
  endOfMonth: endOfMonth(new Date()),
  startOfLastMonth: startOfMonth(subDays(new Date(), 30)),
  endOfLastMonth: endOfMonth(subDays(new Date(), 30)),
  startOfYear: startOfYear(new Date()),
  endOfYear: endOfYear(new Date()),
};

const staticRanges = createStaticRanges([
  {
    label: 'Today',
    range: () => ({
      startDate: defineds.startOfToday,
      endDate: defineds.endOfToday,
    }),
  },
  {
    label: 'Yesterday',
    range: () => ({
      startDate: defineds.startOfYesterday,
      endDate: defineds.endOfYesterday,
    }),
  },
  {
    label: 'This week',
    range: () => ({
      startDate: defineds.startOfWeek,
      endDate: defineds.endOfWeek,
    }),
  },
  {
    label: 'Last week',
    range: () => ({
      startDate: defineds.startOfLastWeek,
      endDate: defineds.endOfLastWeek,
    }),
  },
  {
    label: 'Last 7 days',
    range: () => ({
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
    }),
  },
  {
    label: 'Last 14 days',
    range: () => ({
      startDate: subDays(new Date(), 14),
      endDate: new Date(),
    }),
  },
  {
    label: 'This month',
    range: () => ({
      startDate: defineds.startOfMonth,
      endDate: defineds.endOfMonth,
    }),
  },
  {
    label: 'Last 30 days',
    range: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }),
  },
  {
    label: 'Last month',
    range: () => ({
      startDate: defineds.startOfLastMonth,
      endDate: defineds.endOfLastMonth,
    }),
  },
  {
    label: 'This year',
    range: () => ({
      startDate: defineds.startOfYear,
      endDate: defineds.endOfYear,
    }),
  },
]);

const CustomDateRangePicker = ({ onChange, initialStartDate, initialEndDate, onClose }) => {
  const [state, setState] = useState([
    {
      startDate: initialStartDate || new Date(),
      endDate: initialEndDate || new Date(),
      key: 'selection'
    }
  ]);

  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      setState([
        {
          startDate: initialStartDate,
          endDate: initialEndDate,
          key: 'selection'
        }
      ]);
    }
  }, [initialStartDate, initialEndDate]);

  const handleSelect = (ranges) => {
    setState([ranges.selection]);
    if (onChange) {
      onChange(ranges.selection);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'MMM dd yyyy');
  };

  return (
    <div className="custom-date-range-picker-container">
      <div className="custom-date-inputs">
        <div className="date-input-box">
          {formatDate(state[0].startDate)}
        </div>
        <span className="date-separator">to</span>
        <div className="date-input-box">
          {formatDate(state[0].endDate)}
        </div>
      </div>
      <div className="custom-date-range-picker">
        <DateRangePicker
          onChange={handleSelect}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          months={2}
          ranges={state}
          direction="horizontal"
          staticRanges={staticRanges}
          inputRanges={[]}
          rangeColors={['#e0f2fe']}
        />
      </div>
      <div className="custom-date-actions">
        <button className="date-cancel-btn" onClick={onClose}>Cancel</button>
        <button className="date-apply-btn" onClick={() => {
          if (onChange) onChange(state[0]);
          if (onClose) onClose();
        }}>Apply</button>
      </div>
    </div>
  );
};

export default CustomDateRangePicker;
