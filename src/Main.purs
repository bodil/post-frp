module Main where

import Data.Tuple
import Data.Maybe
import Data.Array (delete, sort, (..), (!!))

import qualified Data.Char as Char

import Debug.Trace

import Control.Functor (($>))
import Control.Alternative
import Control.Bind
import Control.Monad.Eff

import DOM

import Data.DOM.Simple.Document
import Data.DOM.Simple.Element
import Data.DOM.Simple.Types
import Data.DOM.Simple.Window

import Halogen
import Halogen.Signal
import Halogen.Component

import qualified Halogen.HTML as H
import qualified Halogen.HTML.Attributes as A
import qualified Halogen.HTML.Events as A
import qualified Halogen.HTML.Events.Forms as A
import qualified Halogen.HTML.Events.Handler as E



appendToBody :: forall eff. HTMLElement ->
                Eff (dom :: DOM | eff) Unit
appendToBody e = do
  doc <- document globalWindow
  Just app <- querySelector "#app" doc
  appendChild app e



type Pony = String

data ListState = ListState [Pony] Pony

data ListInput = NewPony | EntryUpdated Pony | RemovePony Pony

ui :: forall m. (Alternative m) =>
        Component m ListInput ListInput
ui = render <$>
       stateful (ListState
                 [ "applejack"
                 , "fluttershy"
                 , "rarity"
                 ] "") update
  where
    render :: ListState -> H.HTML (m ListInput)
    render (ListState ponies entry) =
      H.div_
        [ H.h1_
          [ H.img [ A.src "dash.gif" ] []
          , H.text "Ponies"
          , H.img [ A.src "pinkie.gif" ] []
          ]
        , H.ul_ (renderPony <$> ponies)
        , H.form [ A.onSubmit (\_ -> E.preventDefault $> pure NewPony) ]
            [ H.input
              [ A.type_ "text"
              , A.value entry
              , A.onValueChanged (A.input EntryUpdated)
              ] []
            ]
        ]

    renderPony :: Pony -> H.HTML (m ListInput)
    renderPony p =
      H.li_ [ H.button [ A.onClick $ A.input_ $ RemovePony p ]
                        [ H.text (Char.charString (Char.fromCharCode 10007)) ]
            , H.text p
            ]

    update :: ListState -> ListInput -> ListState
    update (ListState ponies _) (EntryUpdated e) =
      ListState ponies e
    update (ListState ponies pony) NewPony =
      ListState (sort $ pony : ponies) ""
    update (ListState ponies entry) (RemovePony pony) =
      ListState (delete pony ponies) entry

main = do
  Tuple node driver <- runUI ui
  appendToBody node
