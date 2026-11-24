import type { ModuleEnvelope, SidPopulation } from '@lobby/contract';
import styles from '../../design/cards.module.css';
import { copy } from '../../shared/copy/id';
import { useGlobalBeat } from '../../shared/hooks/useGlobalBeat';

export interface CitizenProfileCardProps {
  readonly module: ModuleEnvelope<SidPopulation>;
  readonly serverTimeOffsetMs?: number;
}

export function CitizenProfileCard({ module, serverTimeOffsetMs = 0 }: CitizenProfileCardProps) {
  const { state, data } = module;

  // F07: 3 slides if published and ok; 1 slide if unpublished/unavailable
  const isPublished = state === 'ok' && (data?.published ?? false);
  const slideCount = isPublished ? 3 : 1;

  const { slideIndex } = useGlobalBeat(slideCount, serverTimeOffsetMs);

  if (state === 'loading') {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>📊</span>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.common.loading}</div>
        </div>
      </div>
    );
  }

  if (state === 'unavailable' || !data) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>📊</span>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.profile.unavailable}</div>
        </div>
      </div>
    );
  }

  // F07: If unpublished, display single slide without rotating
  if (!data.published) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>📊</span>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.placeholderText}>{copy.profile.unregistered}</div>
        </div>
      </div>
    );
  }

  const { age_pyramid, occupations, hamlets } = data;

  // Slide 0: Age Pyramid
  if (slideIndex === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>📊</span>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
          <span className={styles.cardHeaderMeta}>{copy.profile.pyramidTitle}</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
            {age_pyramid.buckets.slice(0, 6).map((b) => (
              <div
                key={b.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ width: '45px', color: 'var(--color-text-secondary)' }}>
                  {b.label}
                </span>
                <span style={{ color: '#38bdf8' }}>L: {b.male ?? copy.profile.suppressed}</span>
                <span style={{ color: '#ec4899' }}>P: {b.female ?? copy.profile.suppressed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Slide 1: Occupations
  if (slideIndex === 1) {
    const others = occupations.others_count?.toString() ?? copy.profile.suppressed;
    const nonWorking = occupations.non_working_count?.toString() ?? copy.profile.suppressed;
    const unfilled = occupations.unfilled_count?.toString() ?? copy.profile.suppressed;

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <span className={styles.cardIcon}>💼</span>
            <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
          </div>
          <span className={styles.cardHeaderMeta}>{copy.profile.occupationTitle}</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            {occupations.top.slice(0, 4).map((job) => (
              <div key={job.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{job.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {job.count.toLocaleString('id-ID')} orang
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {copy.profile.otherSummary(others, nonWorking, unfilled)}
          </div>
        </div>
      </div>
    );
  }

  // Slide 2: Hamlets (Dusun)
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIcon}>🏘️</span>
          <h2 className={styles.cardTitle}>{copy.profile.cardTitle}</h2>
        </div>
        <span className={styles.cardHeaderMeta}>{copy.profile.hamletTitle}</span>
      </div>
      <div className={styles.cardBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          {hamlets.items.slice(0, 4).map((hamlet) => (
            <div key={hamlet.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{hamlet.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {hamlet.count === null
                  ? copy.profile.suppressed
                  : `${hamlet.count.toString()} warga`}
              </span>
            </div>
          ))}
          {hamlets.unassigned_count !== null && hamlets.unassigned_count > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--color-text-muted)',
              }}
            >
              <span>{copy.profile.unassignedHamlet}</span>
              <span>{hamlets.unassigned_count.toString()} warga</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
