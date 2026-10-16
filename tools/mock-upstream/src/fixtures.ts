// Fixtures shared with the contract tests, so mock responses always match @lobby/contract.
import cimartError from '@lobby/contract/fixtures/cimart/error.json' with { type: 'json' };
import cimartEmpty from '@lobby/contract/fixtures/cimart/lobby-summary.empty.json' with { type: 'json' };
import cimartPhase0 from '@lobby/contract/fixtures/cimart/lobby-summary.phase0.json' with { type: 'json' };
import cimartPhase1 from '@lobby/contract/fixtures/cimart/lobby-summary.phase1.json' with { type: 'json' };
import sidError from '@lobby/contract/fixtures/sid/error.json' with { type: 'json' };
import populationPublished from '@lobby/contract/fixtures/sid/population.published.json' with { type: 'json' };
import populationUnpublished from '@lobby/contract/fixtures/sid/population.unpublished.json' with { type: 'json' };
import servicesNormal from '@lobby/contract/fixtures/sid/services.normal.json' with { type: 'json' };
import alertBaselineSafe from '@lobby/contract/fixtures/sigap/alerts-current.baseline-safe.json' with { type: 'json' };
import alertGreen from '@lobby/contract/fixtures/sigap/alerts-current.green.json' with { type: 'json' };
import alertOrange from '@lobby/contract/fixtures/sigap/alerts-current.orange.json' with { type: 'json' };
import alertRed from '@lobby/contract/fixtures/sigap/alerts-current.red.json' with { type: 'json' };
import alertYellow from '@lobby/contract/fixtures/sigap/alerts-current.yellow.json' with { type: 'json' };
import quakeIndonesia from '@lobby/contract/fixtures/sigap/earthquakes-indonesia.normal.json' with { type: 'json' };
import quakePangandaran from '@lobby/contract/fixtures/sigap/earthquakes-pangandaran.normal.json' with { type: 'json' };
import recentIndonesia from '@lobby/contract/fixtures/sigap/earthquakes-recent.indonesia.json' with { type: 'json' };
import recentWestJava from '@lobby/contract/fixtures/sigap/earthquakes-recent.west-java.json' with { type: 'json' };
import quakeWestJava from '@lobby/contract/fixtures/sigap/earthquakes-west-java.normal.json' with { type: 'json' };
import emergencyContacts from '@lobby/contract/fixtures/sigap/emergency-contacts.normal.json' with { type: 'json' };
import sigapError from '@lobby/contract/fixtures/sigap/error.json' with { type: 'json' };
import sigapNotFound from '@lobby/contract/fixtures/sigap/error.not-found.json' with { type: 'json' };
import evacuationPoints from '@lobby/contract/fixtures/sigap/evacuation-points.normal.json' with { type: 'json' };
import weatherForecast from '@lobby/contract/fixtures/sigap/weather-forecast.normal.json' with { type: 'json' };

export const fixtures = {
  sigap: {
    alertGreen,
    alertYellow,
    alertOrange,
    alertRed,
    alertBaselineSafe,
    quakePangandaran,
    quakeWestJava,
    quakeIndonesia,
    recentWestJava,
    recentIndonesia,
    weatherForecast,
    evacuationPoints,
    emergencyContacts,
    error: sigapError,
    notFound: sigapNotFound,
  },
  sid: { populationPublished, populationUnpublished, servicesNormal, error: sidError },
  cimart: { phase0: cimartPhase0, phase1: cimartPhase1, empty: cimartEmpty, error: cimartError },
} as const;
