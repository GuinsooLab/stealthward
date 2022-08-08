import React, { ReactElement } from 'react';
import { FaRegSmileBeam } from 'react-icons/all';
import { generateSchemaChangeMessage } from '../utils/helpers';
import { ReDataModelDetails } from '../contexts/redataOverviewContext';
import EmptyContent from './EmptyContent';
import colors from '../utils/colors.js';

export interface SchemaChangesProps {
  modelDetails: ReDataModelDetails;
  showTitle?: boolean;
}

function SchemaChanges(params: SchemaChangesProps): ReactElement {
  const { modelDetails, showTitle = true } = params;
  const { schemaChanges } = modelDetails;

  return (
    <>
      {showTitle && (
        <p className="text-lg font-medium mb-1">Schema Changes</p>
      )}
      {schemaChanges.length
        ? (
          <div className="mb-3 grid grid-cols-1">
            <div className="flex flex-col">
              <div className="-my-2 sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block max-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-scroll border-b border-gray-200 sm:rounded-lg">
                    <table className="max-w-full divide-y divide-gray-200 w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium
                             text-gray-500 uppercase tracking-wider"
                          >
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">

                        {schemaChanges.map((change) => (
                          <tr key={`${change.id}_${change.prev_column_name}`}>
                            <td className="px-6 text-sm py-4 whitespace-nowrap">
                              <div
                                className="text-gray-900"
                              >
                                {generateSchemaChangeMessage(change)}
                              </div>
                            </td>
                          </tr>
                        ))}

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        : (
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg p-4 mt-3 mb-3">
            <EmptyContent text="No Schema Changes!">
              <FaRegSmileBeam size={50} color={colors.primary} />
            </EmptyContent>
          </div>
        )}
    </>
  );
}

export default SchemaChanges;
