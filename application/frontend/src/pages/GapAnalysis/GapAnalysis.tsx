import './GapAnalysis.scss';

import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Dropdown, DropdownItemProps, Icon, Popup, Table } from 'semantic-ui-react';

import { LoadingAndErrorIndicator } from '../../components/LoadingAndErrorIndicator';
import { GA_STRONG_UPPER_LIMIT } from '../../const';
import { useEnvironment } from '../../hooks';
import { GapAnalysisPathStart, OwaspTop10Comparison, SpecializedCheatsheetSection } from '../../types';
import { getDocumentDisplayName } from '../../utils';
import { getInternalUrl } from '../../utils/document';

const GetSegmentText = (segment, segmentID) => {
  let textPart = segment.end;
  let nextID = segment.end.id;
  let arrow = <Icon name="arrow down" />;
  if (segmentID !== segment.start.id) {
    textPart = segment.start;
    nextID = segment.start.id;
    arrow = <Icon name="arrow up" />;
  }
  const text = (
    <>
      <br />
      {arrow}{' '}
      <span style={{ textTransform: 'capitalize' }}>
        {segment.relationship.replace('_', ' ').toLowerCase()} {segment.score > 0 && <> (+{segment.score})</>}
      </span>
      <br /> {getDocumentDisplayName(textPart, true)} {textPart.section ?? ''} {textPart.subsection ?? ''}{' '}
      {textPart.description ?? ''}
    </>
  );
  return { text, nextID };
};

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const getInitialStandardsFromQuery = (searchParams: URLSearchParams) => {
  const standardParams = searchParams.getAll('standard').filter(Boolean);
  if (standardParams.length >= 2) {
    return {
      base: standardParams[0],
      compare: standardParams[1],
    };
  }

  return {
    base: searchParams.get('base') ?? '',
    compare: searchParams.get('compare') ?? '',
  };
};

const GetStrength = (score) => {
  if (score == 0) return 'Shared CRE';
  if (score <= GA_STRONG_UPPER_LIMIT) return 'Strong';
  if (score >= 7) return 'Weak';
  return 'Average';
};

const GetStrengthColor = (score) => {
  if (score === 0) return 'darkgreen';
  if (score <= GA_STRONG_UPPER_LIMIT) return '#93C54B';
  if (score >= 7) return 'Red';
  return 'Orange';
};

const CHEATSHEET_CATEGORY_LABELS = {
  'LLM Prompt Injection Prevention Cheat Sheet': 'AI',
  'AI Agent Security Cheat Sheet': 'AI',
  'Secure AI Model Ops Cheat Sheet': 'AI',
  'REST Security Cheat Sheet': 'API',
  'Authorization Cheat Sheet': 'API',
  'Server Side Request Forgery Prevention Cheat Sheet': 'API',
  'Web Service Security Cheat Sheet': 'API',
  'Docker Security Cheat Sheet': 'Cloud',
  'Kubernetes Security Cheat Sheet': 'Cloud',
  'Secure Cloud Architecture Cheat Sheet': 'Cloud',
};

const formatCheatsheetLabel = (document, specializedCategory?: string) => {
  if (document?.name !== 'OWASP Cheat Sheets') {
    return getDocumentDisplayName(document, true);
  }

  const category =
    CHEATSHEET_CATEGORY_LABELS[document.section] ??
    (specializedCategory?.includes('AI')
      ? 'AI'
      : specializedCategory?.includes('API')
      ? 'API'
      : specializedCategory?.includes('Cloud')
      ? 'Cloud'
      : 'Web');

  return `${category} Cheat Sheet: ${document.section}`;
};

const GetResultLine = (path, gapAnalysis, key, specializedCategory?: string) => {
  let segmentID = gapAnalysis[key].start.id;
  return (
    <div key={path.end.id} style={{ marginBottom: '.25em', fontWeight: 'bold' }}>
      <a href={getInternalUrl(path.end)} target="_blank" rel="noopener noreferrer">
        <Popup
          wide="very"
          size="large"
          style={{ textAlign: 'center' }}
          hoverable
          position="right center"
          trigger={<span>{formatCheatsheetLabel(path.end, specializedCategory)} </span>}
        >
          <Popup.Content>
            {getDocumentDisplayName(gapAnalysis[key].start, true)}
            {path.path.map((segment) => {
              const { text, nextID } = GetSegmentText(segment, segmentID);
              segmentID = nextID;
              return text;
            })}
          </Popup.Content>
        </Popup>
        <Popup
          wide="very"
          size="large"
          style={{ textAlign: 'center' }}
          hoverable
          position="right center"
          trigger={
            <b style={{ color: GetStrengthColor(path.score) }}>
              ({GetStrength(path.score)}:{path.score})
            </b>
          }
        >
          <Popup.Content>
            <b>Generally: lower is better</b>
            <br />
            <b style={{ color: GetStrengthColor(0) }}>{GetStrength(0)}</b>: Standards share a directly linked CRE
            <br />
            <b style={{ color: GetStrengthColor(GA_STRONG_UPPER_LIMIT) }}>
              {GetStrength(GA_STRONG_UPPER_LIMIT)}
            </b>
            : Closely connected likely to have majority overlap
            <br />
            <b style={{ color: GetStrengthColor(6) }}>{GetStrength(6)}</b>: Connected likely to have partial
            overlap
            <br />
            <b style={{ color: GetStrengthColor(7) }}>{GetStrength(7)}</b>: Weakly connected likely to have
            small or no overlap
          </Popup.Content>
        </Popup>
      </a>
    </div>
  );
};

export const GapAnalysis = () => {
  const standardOptionsDefault = [{ key: '', text: '', value: undefined }];
  const searchParams = useQuery();
  const initialStandards = getInitialStandardsFromQuery(searchParams);
  const [standardOptions, setStandardOptions] = useState<DropdownItemProps[] | undefined>(
    standardOptionsDefault
  );
  const [BaseStandard, setBaseStandard] = useState<string | undefined>(initialStandards.base);
  const [CompareStandard, setCompareStandard] = useState<string | undefined>(initialStandards.compare);
  const [gaJob, setgaJob] = useState<string>('');
  const [gapAnalysis, setGapAnalysis] = useState<Record<string, GapAnalysisPathStart>>();
  const [owaspComparison, setOwaspComparison] = useState<OwaspTop10Comparison>();
  const [specializedCheatsheetSection, setSpecializedCheatsheetSection] =
    useState<SpecializedCheatsheetSection>();
  const [loadingStandards, setLoadingStandards] = useState<boolean>(false);
  const [loadingGA, setLoadingGA] = useState<boolean>(false);
  const [error, setError] = useState<string | null | object>(null);
  const { apiUrl } = useEnvironment();
  const timerIdRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(`${apiUrl}/ga_standards`);
      setLoadingStandards(false);
      setStandardOptions(
        standardOptionsDefault.concat(result.data.sort().map((x) => ({ key: x, text: x, value: x })))
      );
    };

    setLoadingStandards(true);
    fetchData().catch((e) => {
      setLoadingStandards(false);
      setError(e.response.data.message ?? e.message);
    });
  }, [setStandardOptions, setLoadingStandards, setError]);

  useEffect(() => {
    const pollingCallback = () => {
      const fetchData = async () => {
        const result = await axios.get(`${apiUrl}/ma_job_results?id=` + gaJob, {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
        if (result.data.result) {
          setLoadingGA(false);
          setGapAnalysis(result.data.result);
          setSpecializedCheatsheetSection(result.data.specialized_cheatsheet_section);
          setgaJob('');
        }
      };
      if (!gaJob) return;
      fetchData().catch((e) => {
        setLoadingGA(false);
        setError(e.response.data.message ?? e.message);
      });
    };

    const startPolling = () => {
      // Polling every 10 seconds
      timerIdRef.current = setInterval(pollingCallback, 10000);
    };
    const stopPolling = () => {
      clearInterval(timerIdRef.current);
    };

    if (gaJob) {
      console.log('started polling');
      startPolling();
    } else {
      console.log('stoped polling');
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [gaJob]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(
        `${apiUrl}/map_analysis?standard=${BaseStandard}&standard=${CompareStandard}`
      );
      if (result.data.result) {
        setLoadingGA(false);
        setGapAnalysis(result.data.result);
        setOwaspComparison(result.data.owasp_top10_comparison);
        setSpecializedCheatsheetSection(result.data.specialized_cheatsheet_section);
      } else if (result.data.owasp_top10_comparison) {
        setLoadingGA(false);
        setGapAnalysis(undefined);
        setOwaspComparison(result.data.owasp_top10_comparison);
        setSpecializedCheatsheetSection(result.data.specialized_cheatsheet_section);
      } else if (result.data.job_id) {
        setgaJob(result.data.job_id);
      }
    };

    if (!BaseStandard || !CompareStandard || BaseStandard === CompareStandard) return;
    setGapAnalysis(undefined);
    setOwaspComparison(undefined);
    setSpecializedCheatsheetSection(undefined);
    setLoadingGA(true);
    fetchData().catch((e) => {
      setLoadingGA(false);
      setError(e.response.data.message ?? e.message);
    });
  }, [BaseStandard, CompareStandard, setGapAnalysis, setLoadingGA, setError]);

  const getWeakLinks = useCallback(
    async (key) => {
      if (!gapAnalysis) return;
      const result = await axios.get(
        `${apiUrl}/map_analysis_weak_links?standard=${BaseStandard}&standard=${CompareStandard}&key=${key}`
      );
      if (result.data.result) {
        setGapAnalysis((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              weakLinks: result.data.result.paths,
            },
          };
        });
      }
    },
    [gapAnalysis, setGapAnalysis]
  );

  return (
    <main id="gap-analysis">
      <h1 className="standard-page__heading">Map Analysis</h1>
      <LoadingAndErrorIndicator loading={loadingGA || loadingStandards} error={error} />

      <Table celled padded compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              <span className="name">Base:</span>
              <Dropdown
                placeholder="Base Standard"
                search
                selection
                options={standardOptions}
                onChange={(e, { value }) => setBaseStandard(value?.toString())}
                value={BaseStandard}
              />
            </Table.HeaderCell>
            <Table.HeaderCell>
              <span className="name">Compare:</span>
              <Dropdown
                placeholder="Compare Standard"
                search
                selection
                options={standardOptions}
                onChange={(e, { value }) => setCompareStandard(value?.toString())}
                value={CompareStandard}
              />
              {gapAnalysis && (
                <div style={{ float: 'right' }}>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/map_analysis?base=${encodeURIComponent(
                          BaseStandard || ''
                        )}&compare=${encodeURIComponent(CompareStandard || '')}`
                      );
                    }}
                    target="_blank"
                  >
                    <Icon name="share square" /> Copy link to analysis
                  </Button>
                </div>
              )}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {gapAnalysis && !specializedCheatsheetSection && (
            <>
              {Object.keys(gapAnalysis)
                .sort((a, b) =>
                  getDocumentDisplayName(gapAnalysis[a].start, true).localeCompare(
                    getDocumentDisplayName(gapAnalysis[b].start, true)
                  )
                )
                .map((key) => (
                  <Table.Row key={key}>
                    <Table.Cell textAlign="left" verticalAlign="top" selectable>
                      <a
                        href={getInternalUrl(gapAnalysis[key].start)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <p>
                          <b>{getDocumentDisplayName(gapAnalysis[key].start, true)}</b>
                        </p>
                      </a>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: '35vw' }}>
                      {Object.values<any>(gapAnalysis[key].paths)
                        .sort((a, b) => a.score - b.score)
                        .map((path) => GetResultLine(path, gapAnalysis, key))}
                      {gapAnalysis[key].weakLinks &&
                        Object.values<any>(gapAnalysis[key].weakLinks)
                          .sort((a, b) => a.score - b.score)
                          .map((path) => GetResultLine(path, gapAnalysis, key))}
                      {gapAnalysis[key].extra > 0 && !gapAnalysis[key].weakLinks && (
                        <Button onClick={async () => await getWeakLinks(key)}>
                          Show average and weak links ({gapAnalysis[key].extra})
                        </Button>
                      )}
                      {Object.keys(gapAnalysis[key].paths).length === 0 && gapAnalysis[key].extra === 0 && (
                        <i>No links Found</i>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
            </>
          )}
        </Table.Body>
      </Table>
      {specializedCheatsheetSection && (
        <div className="specialized-cheatsheets">
          <h2>{specializedCheatsheetSection.category}</h2>
          <p>
            Showing only the specialized OWASP Cheat Sheets for this comparison so the results stay focused.
          </p>
          <Table celled padded compact>
            <Table.Body>
              {Object.keys(specializedCheatsheetSection.result)
                .sort((a, b) =>
                  getDocumentDisplayName(
                    specializedCheatsheetSection.result[a].start,
                    true
                  ).localeCompare(
                    getDocumentDisplayName(
                      specializedCheatsheetSection.result[b].start,
                      true
                    )
                  )
                )
                .map((key) => (
                  <Table.Row key={key}>
                    <Table.Cell textAlign="left" verticalAlign="top" selectable>
                      <a
                        href={getInternalUrl(specializedCheatsheetSection.result[key].start)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <p>
                          <b>{getDocumentDisplayName(specializedCheatsheetSection.result[key].start, true)}</b>
                        </p>
                      </a>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: '35vw' }}>
                      {Object.values<any>(specializedCheatsheetSection.result[key].paths)
                        .sort((a, b) => a.score - b.score)
                        .map((path) =>
                          GetResultLine(
                            path,
                            specializedCheatsheetSection.result,
                            key,
                            specializedCheatsheetSection.category
                          )
                        )}
                      {specializedCheatsheetSection.result[key].weakLinks &&
                        Object.values<any>(specializedCheatsheetSection.result[key].weakLinks)
                          .sort((a, b) => a.score - b.score)
                          .map((path) =>
                            GetResultLine(
                              path,
                              specializedCheatsheetSection.result,
                              key,
                              specializedCheatsheetSection.category
                            )
                          )}
                      {Object.keys(specializedCheatsheetSection.result[key].paths).length === 0 &&
                        specializedCheatsheetSection.result[key].extra === 0 && <i>No links Found</i>}
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table>
        </div>
      )}
      {owaspComparison && (
        <Table celled padded compact style={{ marginTop: '2rem' }}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={2}>Rank</Table.HeaderCell>
              <Table.HeaderCell width={6}>OWASP Top 10 2021</Table.HeaderCell>
              <Table.HeaderCell width={6}>OWASP Top 10 2025</Table.HeaderCell>
              <Table.HeaderCell width={2}>Changed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {owaspComparison.items.map((item) => (
              <Table.Row key={item.rank}>
                <Table.Cell>
                  <b>{item.rank}</b>
                </Table.Cell>
                <Table.Cell>
                  {item.top10_2021?.hyperlink ? (
                    <a href={item.top10_2021.hyperlink} target="_blank" rel="noopener noreferrer">
                      {item.top10_2021.section}
                    </a>
                  ) : (
                    item.top10_2021?.section ?? <i>Not mapped</i>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {item.top10_2025?.hyperlink ? (
                    <a href={item.top10_2025.hyperlink} target="_blank" rel="noopener noreferrer">
                      {item.top10_2025.section}
                    </a>
                  ) : (
                    item.top10_2025?.section ?? <i>Not mapped</i>
                  )}
                </Table.Cell>
                <Table.Cell>{item.changed ? 'Yes' : 'No'}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </main>
  );
};
