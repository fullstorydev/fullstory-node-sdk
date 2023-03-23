import * as events from './events.index';
import * as users from './users.index';

// TODO(sabrina): unfortunately since individual api spec all needs to be generated
// separately, shared models (such as JobMetadata) gets exported in both files.
// Here simply take the first one here.
export default {
    ...users,
    ...events
};