import type { ContentResponse } from '@lobby/contract';
import { useState } from 'react';
import styles from '../design/cards.module.css';
import { useGlobalBeat } from '../shared/hooks/useGlobalBeat';
import { CiMartCard } from './cards/CiMartCard';
import { CitizenProfileCard } from './cards/CitizenProfileCard';
import { LetterServicesCard } from './cards/LetterServicesCard';
import { QuakeListCard } from './cards/QuakeListCard';
import { WeatherCard } from './cards/WeatherCard';

export interface TvCardCarouselProps {
  readonly modules: ContentResponse['modules'];
  readonly serverTimeOffsetMs?: number;
}

const TOTAL_SLIDES = 5;

const SLIDE_TITLES = [
  'Layanan Surat Desa',
  'Profil Warga Desa',
  'Prakiraan Cuaca',
  'Etalase CiMart',
  'Gempa Terkini BMKG',
] as const;

export function TvCardCarousel({ modules, serverTimeOffsetMs = 0 }: TvCardCarouselProps) {
  const { slideIndex: beatSlideIndex } = useGlobalBeat(TOTAL_SLIDES, serverTimeOffsetMs);
  const [manualIndex, setManualIndex] = useState<number | null>(null);

  const activeIndex = manualIndex ?? beatSlideIndex;

  return (
    <div className={styles.carouselContainer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div className={styles.carouselNavbar}>
          <div className={styles.carouselTabs}>
            {SLIDE_TITLES.map((title, idx) => {
              const isActive = idx === activeIndex;
              const tabClasses = [styles.carouselTab, isActive ? styles.carouselTabActive : '']
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  type="button"
                  key={title}
                  className={tabClasses}
                  onClick={() => {
                    setManualIndex(idx);
                  }}
                >
                  <span className={styles.tabNumber}>{(idx + 1).toString().padStart(2, '0')}</span>
                  <span>{title}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.carouselCounter}>
            <span>
              {(activeIndex + 1).toString().padStart(2, '0')} /{' '}
              {TOTAL_SLIDES.toString().padStart(2, '0')}
            </span>
            <span className={styles.carouselDots}>
              {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                <span
                  key={i}
                  className={i === activeIndex ? styles.carouselDotActive : styles.carouselDot}
                >
                  {i === activeIndex ? '●' : '○'}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className={styles.carouselProgressTrack}>
          <div key={activeIndex} className={styles.carouselProgressFill} />
        </div>
      </div>

      <div className={styles.carouselContent}>
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${(activeIndex * 100).toString()}%)` }}
        >
          <div className={styles.carouselSlide}>
            <LetterServicesCard
              module={modules.sid_services}
              serverTimeOffsetMs={serverTimeOffsetMs}
            />
          </div>
          <div className={styles.carouselSlide}>
            <CitizenProfileCard
              module={modules.sid_population}
              serverTimeOffsetMs={serverTimeOffsetMs}
            />
          </div>
          <div className={styles.carouselSlide}>
            <WeatherCard module={modules.weather} serverTimeOffsetMs={serverTimeOffsetMs} />
          </div>
          <div className={styles.carouselSlide}>
            <CiMartCard module={modules.cimart} serverTimeOffsetMs={serverTimeOffsetMs} />
          </div>
          <div className={styles.carouselSlide}>
            <QuakeListCard module={modules.quake_list} serverTimeOffsetMs={serverTimeOffsetMs} />
          </div>
        </div>
      </div>
    </div>
  );
}
