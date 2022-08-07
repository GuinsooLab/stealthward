import React, {
  ReactElement, useCallback, useContext, useEffect, useState,
} from 'react';
import { Elements } from 'react-flow-renderer';
import { useSearchParams } from 'react-router-dom';
import {
  FlowGraph, ModelDetails, Toggle, Select,
} from '../components';
import { optionsProps } from '../components/Select';
import {
  DbtNode, DbtSource, OverviewData, ReDataModelDetails, RedataOverviewContext, SelectOptionProps,
} from '../contexts/redataOverviewContext';
import {
  generateEdge, generateModelId, generateNode, supportedResTypes,
} from '../utils';

type AlertsType = 'anomaly' | 'schema_change' | 'failed_test' | null

type GenerateGraphProps = {
  overview: OverviewData;
  modelName?: string | null;
  modelType?: string | null;
  monitored?: boolean;
  alerts?: AlertsType;
}

type GenerateGraphResponseProps = {
  elements: Elements;
  nodes: Array<optionsProps>;
}

const getAlertData = (modelId: string, aggregatedModels: Map<string, ReDataModelDetails>) => {
  if (aggregatedModels.has(modelId)) {
    const {
      anomalies,
      schemaChanges,
    } = aggregatedModels.get(modelId) as ReDataModelDetails;

    return { anomalies, schemaChanges };
  }
  return { anomalies: new Map(), schemaChanges: [] };
};

const generateGraph = (
  {
    overview, modelName,
    modelType, monitored,
    alerts,
  }: GenerateGraphProps,
): GenerateGraphResponseProps => {
  const elements: Elements = [];
  const nodeSet = new Set();
  const elementObj: Record<string, string> = {};
  const edgesArr: Record<string, string>[] = [];

  const nodes: optionsProps[] = [];

  if (!overview.graph || !overview.modelNodes) {
    return { elements, nodes };
  }

  const {
    dbtMapping,
    modelNodes,
    aggregated_models: aggregatedModels,
    graph: { nodes: dbtNodes, sources: dbtSources },
    failedTests,
  } = overview;
  const allNodes = { ...dbtNodes, ...dbtSources };

  const failedKeys = failedTests ? Object.keys(failedTests) : [];
  const failedTestKeys = new Set([...failedKeys]);

  if (modelName) {
    const {
      parent_map: parentNodes,
      child_map: childNodes,
    } = overview.graph;
    const modelTitle = dbtMapping[modelName];

    // get all the parents and the child nodes of the model name;
    const modelParentNodes = parentNodes[modelTitle] || [];
    const modelChildNodes = childNodes[modelTitle] || [];

    const details = allNodes[modelTitle];
    const modelId = generateModelId(details);

    const { anomalies, schemaChanges } = getAlertData(modelId, aggregatedModels);

    if (!nodeSet.has(modelId)) {
      nodeSet.add(modelId);
      const n = generateNode({
        index: '0',
        modelId,
        details,
        failedTests: failedTestKeys?.has(modelId),
        anomalies: anomalies?.size > 0,
        schemaChanges: schemaChanges?.length > 0,
      });
      elements.push(n);
      elementObj[modelId] = '0';

      const parentNodesLength = modelParentNodes.length;
      const parentSet = new Set();
      const childSet = new Set();

      for (let index = 0; index < parentNodesLength; index++) {
        const parent = modelParentNodes?.[index];
        const parentDetails = allNodes?.[parent];
        const { resource_type: resourceType } = parentDetails;

        if (supportedResTypes?.has(resourceType)) {
          const parentModelId = generateModelId(parentDetails);
          if (!parentSet.has(parentModelId)) {
            parentSet.add(parentModelId);
            const {
              anomalies: parentAnomalies,
              schemaChanges: parentSchemaChanges,
            } = getAlertData(parentModelId, aggregatedModels);

            const key = index + 1;
            const parentNode = generateNode({
              modelId: parentModelId,
              index: key,
              details: parentDetails,
              failedTests: failedTestKeys?.has(parentModelId),
              anomalies: parentAnomalies?.size > 0,
              schemaChanges: parentSchemaChanges?.length > 0,
            });
            elements.push(parentNode);
            elementObj[parentModelId] = key?.toString();

            edgesArr.push({
              from: parentModelId,
              to: modelId,
            });
          }
        }
      }

      for (let index = 0; index < modelChildNodes.length; index++) {
        const child = modelChildNodes?.[index];

        const childDetails = allNodes?.[child];
        const { resource_type: resourceType } = childDetails;
        if (supportedResTypes?.has(resourceType)) {
          const childModelId = generateModelId(childDetails);
          if (!childSet.has(childModelId)) {
            childSet.add(childModelId);
            const {
              anomalies: childAnomalies,
              schemaChanges: childSchemaChanges,
            } = getAlertData(childModelId, aggregatedModels);

            const key = index + 1 + parentNodesLength;
            const childNode = generateNode({
              modelId: childModelId,
              index: key,
              details: childDetails,
              anomalies: childAnomalies?.size > 0,
              failedTests: failedTestKeys?.has(childModelId),
              schemaChanges: childSchemaChanges?.length > 0,
            });
            elements.push(childNode);
            elementObj[childModelId] = key?.toString();

            edgesArr.push({
              from: modelId,
              to: childModelId,
            });
          }
        }
      }
    }
  } else {
    for (let index = 0; index < modelNodes.length; index++) {
      const currentNode = modelNodes?.[index];
      const modelTitle = dbtMapping?.[currentNode.label];
      const details = allNodes?.[modelTitle];
      const modelId = generateModelId(details);

      // for monitored nodes
      const config = details.config as Record<string, unknown>;
      const isNodeMonitored = config?.re_data_monitored || false;
      const { anomalies, schemaChanges } = getAlertData(modelId, aggregatedModels);

      if (alerts === 'anomaly' && anomalies?.size < 1) {
        continue;
      } else if (alerts === 'schema_change' && schemaChanges?.length < 1) {
        continue;
      } else if (alerts === 'failed_test' && !failedTestKeys?.has(modelId)) {
        continue;
      }
      if (monitored && !isNodeMonitored) {
        continue;
      }
      // check if model type exists and this currentNode is of that type
      if (modelType && modelType !== details?.resource_type) {
        continue;
      }

      const node = generateNode({
        index,
        modelId,
        details,
        failedTests: failedTestKeys?.has(modelId),
        anomalies: anomalies?.size > 0,
        schemaChanges: schemaChanges?.length > 0,
      });
      elementObj[modelId] = index?.toString();

      nodes.push({
        label: modelId,
        value: modelId,
      });
      elements.push(node);

      if (details.resource_type !== 'source') {
        const d = details as DbtNode;
        const parentNodes = new Set(d?.depends_on.nodes);
        parentNodes.forEach((parent) => {
          const parentNode: DbtNode | DbtSource = dbtNodes?.[parent]
            ? dbtNodes?.[parent]
            : dbtSources?.[parent];
          if (parentNode) {
            const parentModelId = generateModelId(parentNode);
            edgesArr.push({
              from: parentModelId,
              to: modelId,
            });
          }
        });
      }
    }
  }

  for (let index = 0; index < edgesArr?.length; index++) {
    const { from, to } = edgesArr?.[index];
    const edge = generateEdge({ obj: elementObj, from, to });
    if (edge?.source && edge?.target) {
      elements.push(edge);
    }
  }

  return { elements, nodes };
};

export interface GraphPartialProps {
  modelName?: string | null;
  showModelDetails?: boolean;
  showFilter?: boolean;
}

export enum ModelTabs {
  ANOMALIES = 'anomaly',
  SCHEMA_CHANGES = 'schema',
  METRICS = 'metrics',
  TESTS = 'tests',
}

function GraphPartial(params: GraphPartialProps): ReactElement {
  const {
    modelName = null,
    showModelDetails = true,
    showFilter = true,
  } = params;
  const [monitored, setMonitored] = useState(true);
  const [, setURLSearchParams] = useSearchParams();
  const [searchParams] = useSearchParams();

  const overview: OverviewData = useContext(RedataOverviewContext);
  const overviewDataLoaded = !!overview.graph;
  const [modelType, setModelType] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertsType>(null);
  const [activeTab, setActiveTab] = useState(ModelTabs.ANOMALIES);

  const tab = searchParams.get('tab') as unknown;
  const model = searchParams.get('model') as string;

  useEffect(() => {
    if (tab === 'test') {
      setActiveTab(ModelTabs.TESTS);
    } else {
      setActiveTab(tab ? tab as ModelTabs : ModelTabs.ANOMALIES);
    }
  }, []);

  const { elements, nodes } = generateGraph({
    overview,
    modelName,
    modelType,
    monitored,
    alerts,
  });

  const toggleModelType = (type: string) => {
    setModelType((prevType: string | null) => {
      if (prevType === type) {
        return null;
      }
      return type;
    });
    setAlerts(null);
  };

  const toggleAlerts = (name: AlertsType) => {
    setAlerts((prevName: AlertsType) => {
      if (prevName === name) {
        return null;
      }
      return name;
    });
    setModelType(null);
  };

  const toggleMonitored = useCallback(() => {
    setMonitored(!monitored);
  }, [monitored]);

  const toggleTabs = (tabName: ModelTabs) => {
    setActiveTab(tabName);
    if (model) {
      setURLSearchParams({ model, tab: tabName });
    } else {
      setURLSearchParams({ tab: tabName });
    }
  };

  const handleChange = (option: SelectOptionProps | null) => {
    if (option) {
      if (activeTab) {
        setURLSearchParams({ model: option.value, tab: activeTab });
      } else {
        setURLSearchParams({ model: option.value });
      }
    }
  };

  return (
    <>
      {showFilter && (
        <div className="absolute top-0 left-32 w-1/4">
          <Select
            value={{ label: model, value: model }}
            options={nodes}
            handleChange={handleChange}
            placeholder="Please enter a table name to highlight node"
          />
        </div>
      )}

      <div className="flex justify-between items-center absolute mt-4 ml-4 mr-20 z-20 w-2/3">
        <div className="flex items-center">
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Source Nodes"
            onClick={() => toggleModelType('source')}
            className={`flex items-center mr-4 ${modelType === 'source' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-source rounded-tooltip" />
            <p className="text-sm font-medium ml-1">Source</p>
          </button>
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Seed Nodes"
            onClick={() => toggleModelType('seed')}
            className={`flex items-center mr-4 ${modelType === 'seed' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-seed rounded-tooltip" />
            <p className="text-sm font-medium ml-1">Seed</p>
          </button>
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Model Nodes"
            onClick={() => toggleModelType('model')}
            className={`flex items-center mr-4 ${modelType === 'model' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-model rounded-tooltip" />
            <p className="text-sm font-medium ml-1">Model</p>
          </button>
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Failed Test"
            onClick={() => toggleAlerts('failed_test')}
            className={`flex items-center mr-4 ${alerts === 'failed_test' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <p className="text-sm font-medium ml-1">Failed Test</p>
          </button>
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Model Nodes"
            onClick={() => toggleAlerts('anomaly')}
            className={`flex items-center mr-4 ${alerts === 'anomaly' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-secondary rounded-full" />
            <p className="text-sm font-medium ml-1">Anomaly</p>
          </button>
          <button
            type="button"
            disabled={!showModelDetails}
            title="Toggle Model Nodes"
            onClick={() => toggleAlerts('schema_change')}
            className={`flex items-center mr-4 ${alerts === 'schema_change' && 'active-tab'}`}
          >
            <div className="w-3 h-3 bg-yellow-300 rounded-full" />
            <p className="text-sm font-medium ml-1">Schema Change</p>
          </button>
        </div>
        {showModelDetails && (
          <div className="mr-8">
            <Toggle
              label1="Monitored"
              label2="All Nodes"
              onChange={toggleMonitored}
            />
          </div>
        )}
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-12
        gap-4 bg-white border-2 border-solid border-gray-200 rounded-lg h-full"
      >
        <div className={showModelDetails ? 'col-span-8' : 'col-span-12'}>
          {overviewDataLoaded && (
            <FlowGraph
              data={elements}
              disableClick={!showModelDetails}
              modelName={modelName}
            />
          )}
        </div>

        {showModelDetails && <ModelDetails activeTab={activeTab} toggleTabs={toggleTabs} />}
      </div>
    </>
  );
}

export default GraphPartial;
