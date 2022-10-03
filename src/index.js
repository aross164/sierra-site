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

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: '/',
                redirect: '/rankings',
                element: <Rankings/>
            },
            {
                path: 'rankings/:week',
                element: <Rankings/>
            },
            {
                path: 'trades',
                element: <Trades />
            },
            {
                path: 'angry',
                element: <EditRankings week={1}/>
            },
            {
                path: 'boring',
                element: <EditRankings week={2}/>
            },
            {
                path: 'cash',
                element: <EditRankings week={3}/>
            },
            {
                path: 'dance',
                element: <EditRankings week={4}/>
            },
            {
                path: 'eager',
                element: <EditRankings week={5}/>
            },
            {
                path: 'face',
                element: <EditRankings week={6}/>
            },
            {
                path: 'girl',
                element: <EditRankings week={7}/>
            },
            {
                path: 'hamper',
                element: <EditRankings week={8}/>
            },
            {
                path: 'idle',
                element: <EditRankings week={9}/>
            },
            {
                path: 'jumper',
                element: <EditRankings week={10}/>
            },
            {
                path: 'kid',
                element: <EditRankings week={11}/>
            },
            {
                path: 'looker',
                element: <EditRankings week={12}/>
            },
            {
                path: 'mount',
                element: <EditRankings week={13}/>
            },
            {
                path: 'nail',
                element: <EditRankings week={14}/>
            },
            {
                path: 'oasis',
                element: <EditRankings week={15}/>
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
