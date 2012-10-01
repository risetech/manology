// Created by Vladislav Egorov
// vladislav.krd@gmail.com
// 17.04.2009

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TextClassifierLib
{
    public class Stemming
    {    
        const string c_vower = "аеиоуыэюя";
        const string c_perfectiveground = "((ив|ивши|ившись|ыв|ывши|ывшись)|((?<=[ая])(в|вши|вшись)))$";
        const string c_reflexive = "(с[яь])$";
        const string c_adjective = "(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|еых|ую|юю|ая|яя|ою|ею|их)$";
        const string c_participle = "((ивш|ывш|ующ)|((?<=[ая])(ем|нн|вш|ющ|щ)))$";
        const string c_verb = "((ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ены|ить|ыть|ишь|ую|ю)|((?<=[ая])(ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)))$";
        const string c_noun = "(а|ев|ов|ие|ье|е|иями|ями|ами|еи|ии|и|ией|ей|ой|ий|й|и|иям|ям|ием|ем|ам|ом|о|у|ах|иях|ях|ы|ь|ию|ью|ю|ия|ья|я)$";
        const string c_rvre = "^(.*?[аеиоуыэюя])(.*)$";
        const string c_derivational = "[^аеиоуыэюя][аеиоуыэюя]+[^аеиоуыэюя]+[аеиоуыэюя].*(?<=о)сть?$";

        public Stemming()
        {
        }

        bool RegexReplace(ref string Original, string Regx, string Value)
        {
            string original = Original;
            Regex reg = new Regex(Regx);
            Original = reg.Replace(Original, Value);
            return (Original != original);
        }

        Match RegexMatch(string Original, string Regx)
        {
            Regex reg = new Regex(Regx);
            return reg.Match(Original);
        }

        MatchCollection RegexMatches(string Original, string Regx)
        {
            Regex reg = new Regex(Regx, RegexOptions.Multiline);
            return reg.Matches(Original);
        }

        public string Parse(string Query)
        {
            Regex reg = new Regex(@"[ ,\.\?!=\&\*\+]");
            string[] words = reg.Split(Query);
            IList<string> swords = new List<string>();

            for (int i = 0; i < words.Length; i++)
                if (!string.IsNullOrEmpty(words[i].Trim()))
                    swords.Add(Stem(words[i].Trim()));

            string result = string.Join("%", swords.ToArray());

            return string.Format("%{0}%", result);
        }

        public string Stem(string Word)
        {
            string word = Word.ToLower().Trim().Replace("ё", "е");
            string value = string.Empty;
            do
            {
                MatchCollection matches = RegexMatches(word, c_rvre);
                if (matches.Count < 1)
                {
                    Match matchEnglishOrDigits = RegexMatch(word, "[a-z0-9]");
                    if (matchEnglishOrDigits.Success)
                        value = word;

                    break;
                }
                    
                
                string rv = matches[0].Value;

                // шаг 1
                if (!RegexReplace(ref rv, c_perfectiveground, string.Empty))
                {
                    RegexReplace(ref rv, c_reflexive, string.Empty);

                    if (RegexReplace(ref rv, c_adjective, string.Empty))
                        RegexReplace(ref rv, c_participle, string.Empty);
                    else
                        if (!RegexReplace(ref rv, c_verb, string.Empty))
                            RegexReplace(ref rv, c_noun, string.Empty);                    
                }

                // шаг 2
                RegexReplace(ref rv, "и$", string.Empty);

                // шаг 3
                Match match = RegexMatch(rv, c_derivational);
                if (match.Success)
                    RegexReplace(ref rv, "ость?$", string.Empty);

                // шаг 4
                if (!RegexReplace(ref rv, "ь$", string.Empty))
                {
                    RegexReplace(ref rv, "ейше?", string.Empty);
                    RegexReplace(ref rv, "нн$", "н");
                }

                value = rv;      
                
            } while (false);

            return value;
        }

    }
}
