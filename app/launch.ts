/**
 * Entrypoint for the application
 */

import minimist from 'minimist';
import Arkitektonika from "./Arkitektonika.js";

const app = new Arkitektonika();
const params = minimist(process.argv.slice(2));

(() => {
    if (params.prune) {
        app.prune().then(() => process.exit(0))
            .catch(reason => console.error(reason));
        return;
    }

    app.run();
})();
