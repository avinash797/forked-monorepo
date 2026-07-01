import { QueryClient } from '@tanstack/react-query';
import Reactotron from 'reactotron-react-native';
import {
    QueryClientManager,
    reactotronReactQuery,
} from 'reactotron-react-query';
const queryClient = new QueryClient();

const queryClientManager = new QueryClientManager({
    // @ts-ignore
    queryClient,
});

Reactotron.configure({
    onDisconnect: () => {
        queryClientManager.unsubscribe();
    },
})
    .use(reactotronReactQuery(queryClientManager))
    .useReactNative()
    .connect();
