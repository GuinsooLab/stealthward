import React from 'react';
import { CellProps } from '../components/Table';

export const StatusCell = ({ value }: CellProps): JSX.Element => (
  <div
    className={`${value?.toLowerCase()} text-xs font-medium text-center py-1 rounded-full`}
  >
    {value}
  </div>
);

export default StatusCell;
