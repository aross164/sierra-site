import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import EditRankings from './routes/EditRankings';
import Rankings from './routes/Rankings';
import Trades from './routes/Trades';
import Schedules from './routes/Schedules';

function sierraLoader({request}){
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    if(!league){
        return window.location.replace(`${request.url}?league=855884259620188160`);
    }

    return {};
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: '/',
                element: <Schedules/>
            },
            {
                path: 'rankings',
                element: <Rankings/>,
                loader: sierraLoader
            },
            {
                path: 'rankings/:week',
                element: <Rankings/>
            },
            {
                path: 'trades',
                element: <Trades/>
            },
            {
                path: 'schedules',
                element: <Schedules/>
            },
            {
                path: 'angry',
                element: <EditRankings week={1}/>,
                loader: sierraLoader
            },
            {
                path: 'boring',
                element: <EditRankings week={2}/>,
                loader: sierraLoader
            },
            {
                path: 'cash',
                element: <EditRankings week={3}/>,
                loader: sierraLoader
            },
            {
                path: 'dance',
                element: <EditRankings week={4}/>,
                loader: sierraLoader
            },
            {
                path: 'eager',
                element: <EditRankings week={5}/>,
                loader: sierraLoader
            },
            {
                path: 'face',
                element: <EditRankings week={6}/>,
                loader: sierraLoader
            },
            {
                path: 'girl',
                element: <EditRankings week={7}/>,
                loader: sierraLoader
            },
            {
                path: 'hamper',
                element: <EditRankings week={8}/>,
                loader: sierraLoader
            },
            {
                path: 'idle',
                element: <EditRankings week={9}/>,
                loader: sierraLoader
            },
            {
                path: 'jumper',
                element: <EditRankings week={10}/>,
                loader: sierraLoader
            },
            {
                path: 'kid',
                element: <EditRankings week={11}/>,
                loader: sierraLoader
            },
            {
                path: 'looker',
                element: <EditRankings week={12}/>,
                loader: sierraLoader
            },
            {
                path: 'mount',
                element: <EditRankings week={13}/>,
                loader: sierraLoader
            },
            {
                path: 'nail',
                element: <EditRankings week={14}/>,
                loader: sierraLoader
            },
            {
                path: 'oasis',
                element: <EditRankings week={15}/>,
                loader: sierraLoader
            },
        ]
    }
]);

const root = document.getElementById('root');
ReactDOM.render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>, root
);
