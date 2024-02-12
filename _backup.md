---
layout: page
title: About
permalink: /
web_title: About Me | Bryson Lee
---
Hi there - my name is Bryson Lee, and I'm a technical director/technical artist in Computer Graphics (CG) production systems for 3D animation, visual effects, and video games. I'm currently a Software Engineer at [Pixar Animation Studios](https://www.pixar.com/). I graduated from Santa Clara University in 2018 with a B.S. in Computer Science and Engineering.

Before Pixar, I worked as a Software Engineer at [Blizzard Entertainment](https://www.blizzard.com) in the Animation and Cinematics divison of the Story and Franchise Development (SFD) Department. I've also worked with other CG studios, including [Industrial Light and Magic](https://www.ilm.com/), [Walt Disney Animation Studios](https://www.disneyanimation.com/), and [Disney Interactive](https://dcpi.disney.com/). A majority of my projects involved creating artist workflow tools and incoperating advanced assets into a distributed pipeline.

While creative technology and computer graphics is my academic and professional concentration, I'm involved in several other [projects](https://www.brysonlee.com/projects) that cover a wide variety of creative topics, including producing and directing animated content. I occasionally visit schools to run career workshops for students interested in the CG industry.

In my free time, you can usually find me [writing](https://en.wikipedia.org/wiki/Fiction_writing) or [destroying my opponents as a D.Va main](https://en.wikipedia.org/wiki/D.Va). I also do a fair bit of [blogging](https://www.brysonlee.com/posts) about a bunch of random stuff. <!-- The bird in the masthead of my website is the [Nene goose](https://en.wikipedia.org/wiki/Nene_(bird)), the state bird of my hometown of Hawaii. -->

## Contact
Bryson Lee  
Phone: (808) 391-5739  
Email: [brysonhlee@gmail.com](emailto:brysonhlee@gmail.com)
<div class="social-media">
    <a href="emailto:brysonhlee@gmail.com" target="_blank"><img src="/assets/img/mail.png" class="icon" alt="Email me"></a>
    <a href="https://www.linkedin.com/in/bryhlee/" target="_blank"><img src="/assets/img/linkedin.png" class="icon" alt="Find me on Linkedin"></a>
    <a href="https://www.github.com/bryhlee/"><img src="/assets/img/github.png" class="icon" alt="Find me on Github"></a>
    <a href="https://vimeo.com/user80015403" target="_blank"><img src="/assets/img/vimeo.png" class="icon" alt="Find me on Vimeo"></a>
</div>



---
layout: post
date:   2018-03-29 00:22:22 -0700
categories: blog
blog_title: "vcontrol: A Lightweight VCS for Digital Art Assets"
new: true
---

# A VCS for Digital Artists
Increasingly in recent years, digital artists have been using version control systems (VCS) originally meant for software developers to manage complex non-text/binary files. Alongside Jackson Beadle, I decided to develop my own VCS system, *vcontrol*, specifically for nontext and binary files. In essence, *vcontrol* utilizes a simplified and lightweight architecture allowing digital artist to effectively version control art assets in a local environment before officially staging them for review. *vcontrol* was built entirely using Python and packaged using PyInstaller.

The design of vcontrol prioritizes ease of use, portability, and effective file structure organization. Additionally, support for a distributed and decentralized paradigm was a critical requirement as almost every modern version control system can support some form of remote collaboration.

Much of the guidance for this project was from Version Control by Example by Eric Sink. His investigative approach to VCS systems provided valuable context into building most of vcontrol's core architecture, and keeping core design principles consistent with general use cases.

# Core Functionality
Functional requirements were derived from past experience using existing version control systems, but the core functionality of any VCS system is essentially the same:

* Create a repository 
* Detect changes in files between versions
* Save a version of the working project
* Revert to a previous version of the working project
* Fetch the changes to the working project made by other users

The first four requirements are the bare minimum for version control. A user must be able to create a repository to manage different versions and be able to see changes in the working project when files are created, edited, or deleted. Saving the working project allows users to create versions of their project. This version could indicate a myriad of different events, such as creating stable builds of the project or to mark where new features are added. Reverting, along with saving, enable version control so users can create and revisit versions of their project. Fetching changes made by other users makes vcontrol a distributed and decentralized system, enabling remote collaboration for multiple users, with no “master” copy of the project. 

# Inspirations from Git
The design considerations mentioned above inspired our team to add version history paths as a requirement to vcontrol. A version history path is a lineage of file history which can diverge from a common history but also be traced back to a single (or multiple) root source. For example, if a user creates a new file, this would be considered the root source, and any changes to that file would be considered a new file change with respect to that user. If another user were to retrieve the original user’s file history, he or she could change that file and inherently create a new version history path. In git, this paradigm of decentralized version control is known as branching, and differentiates itself from other version control systems like perforce, which use a “master” copy from a centralized server which all other users update. To support a distributed version control system, the feature of “branching” enables there to be no real “master” copy, but instead multiple file history paths for a single project. 

Another major feature from git which we decided to implement in vcontrol was repositories. A repository is essentially an OS directory for which all files that exist in that directory (and all files within subdirectories of that directory) are tracked for changes. This enables a single directory to be treated as a “project folder” and therefore easily shared in a theoretical distributed system, or for networking purposes. A user can easily upload his or her repository to a network for other users to copy to their own local OS. This is known as cloning, which Git handles by initializing repository directories and allowing users to literally clone the directory. Repositories are identified by having a hidden folder, .git, in the top level directory of the repository. This was a critical feature we decided to emulate in our own system.

Quintessentially a version control system must store versions of files, and to store the version of an entire project, Git utilizes the concept of a *commit*. A commit, labeled by a hash (or commit tag), is essentially a entity which describes changes to the current history and contains a point to previous commits. Our team took heavy inspiration from Git’s concept of a commit, but modified it in several ways to fit the needs of vcontrol.

# Limitations
Version control systems vary wildly depending on how they manage their repository. In vcontrol, the repository holds whole files for each commit. Some systems, like git, do not save the entire file each time it is edited, rather only saving the baseline version (usually the first version) plus all of the changes made to the file. That is to say, instead of storing five versions of File A, there is the first version of File A stored in its entirety, plus small pieces of data, delta changes, that record each change to the file. Version five of File A can now be generated from version one of File A and making the delta changes to the file. This reduces the amount of space needed to store all the versions of a file. However, delta changes are not always easy to calculate, especially for files with binary data. While programming projects are mostly text files with code, they may still contain a lot of assets such as images (binary data). We wanted to be able to version control all of these files and therefore chose to store entire files for each version. The decision to store entire files means time is not spent trying to calculate delta changes and recreate files from these delta changes. However, there is an obvious sacrifice in storage costs to store an entire file when only a few lines of text may have changed. 

To mitigate storage costs from storing whole files, vcontrol only stores files that have changed. When a user issues a commit command, only the files that have changed since the previous commit are stored in the repository. Files that have not been edited can be easily retrieved from the commit they were last edited in. For instance if File A was last edited in version 4, and only File B has been edited for version 5, the commit for version 5 only contains version 5 of File B and a reference to retrieve File A from version 4. It is very unlikely for every file in a working project to be edited for every version of the project. Therefore, we are only expanding the size of our repository only when necessary. 

# Implementation
Implementation of vcontrol was based on a command-line-interface (CLI) paradigm, inspired largely by git. The code was built and distributed for multiple platforms entirely using Python 3.6, and packaged using the Pyinstaller openware for cross-OS support. Python was chosen for its flexible standard library which provided robust file system operations, which were imperative for vcontrol as it utilizes complex file structure trees to manage versions. Both the os and shutil libraries were exploited heavily. Python is also a powerful language choice for complex string parsing, which is commonplace for version control systems that utilize extensive filepath construction and filename generation. For vcontrol, we wanted to ensure little need to develop complex string parsing algorithms and instead depended on Python’s already well-optimized string functions.

JSON files were used to contain object metadata; namely, commit history for file tracking, and to store relevant file paths. Python provides a robust JSON decoder, which was used heavily in this project to augment performance while reducing the need for excessive library imports. In this way, leveraging Python alongside JSON enabled vcontrol to be built without third-party dependencies, excluding the standard library which comes bundled with Python 3. In fact, vcontrol can be built from source by anyone with a up-to-date version of Python 3 installed in their system.

The final version of vcontrol is available [on my Github](https://github.com/bryhlee/vcontrol). The master branch can be cloned and built, or the already available command line binary can be added to a relevant path (refer to readme.md). At this time, only macOS is fully supported, and Linux is theoretically compatible but not tested. 

# Repository Design
Repositories, are special OS-level directories which contain all files that need to be tracked by vcontrol. In this way, an entire coding project can be stored within a single directory. All files that are currently in the repository are known as working files. These working files can either have been recently committed (meaning that their version have just been saved) or contain changes as compared to the most recent commit. A repository can be initialized and identified by a `.vcs` hidden directory similar to the .git hidden directory (in Unix-based systems, a directory is hidden if beginning with a period). This hidden directory contains all the data needed to version control that repository, storing its associated commits and repository metadata. The `.vcs` file structure was designed entirely by our team from scratch. 

![vcontrol]({{ site.url }}/assets/img_posts/vcs.png)

First, immediately inside the `.vcs` directory is a file labeled `config.json` which contains repository metadata. This includes the repository name, the user associated with the repository, and details concerning the last fetch/commit made by the user. The last commit metadata is used heavily by vcontrol to determine where to compare changes made to the working files to the files stored in associated commits. An example of the `config.json` is shown below:

```
{
    "repo_name": "testrepo",
    "user": "testuser",
    "last_fetch": "NULL",
    "last_commit": {
        "user": "testuser",
        "value": 5
    }
}
```

The commits subdirectory found inside the `.vcs` hidden directory holds commits. Each commit has an associated commit subdirectory, known as a commit bin. A commit bin is labeled with the the *commit tag*, a unique identifier used to describe a commit in vcontrol.

A commit bin contains commited files alongside a hidden file called `.vcs`, which is another JSON object that holds data concerning that specific commit. Namely, it contains the most recent version for each file in that commit. vcontrol only stores files that have changed, meaning that any file that has not been changed during a commit is still available in previous commit bins, but not available in the most recent commit bin. A typical `.vcs` JSON object might look like this:

```
{
    "commits": {
        "./another_file": {
            "value": 5,
            "subdir": "./.vcs/commits/V00005_testuser",
            "user": "testuser"
        },
        "./another_file_3": {
            "value": 3,
            "subdir": "./.vcs/commits/V00003_testuser",
            "user": "testuser"
        },
        "./another_file_2": {
            "value": 1,
            "subdir": "./.vcs/commits/V00001_testuser",
            "user": "testuser"
        }
    },
    "latest_fetch": {}
}
```

In the example above, if the most recent commit is `V00005_testuser`, then that means only “another_file” will be stored in the `V00005_testuser` commit bin, since this is the only file that changed in this commit. All other files will be stored in the associated commit bins, which were created prior to `V00005_testuser`. Note that the user of the commit is stored as well, which is imperative to vcontrol’s handling of decentralized and distributed version control. 

Storing these commit keys is also used for reverting the state of the working files to previous commits, as a commit bin does not necessarily hold all the files for that commit. In addition, it is important to note that a commit bin could theoretically hold nothing but a `.vcs` JSON file if only working files are deleted in that commit, and no working file is changed or added. A file that is deleted will remove that file (which is the key) in the commits dictionary within the `.vcs` JSON.

# Commit and Commit Tags

A commit is a version of the repository. More specifically, a commit tracks the version of all files inside the repository, previously described as a working file, or a file that exists in the repository. Commited files move in a linear fashion, meaning that whenever the state of a file has changed, the file can be committed. A working file can have four states, when compared to the last commit made:

* **Unchanged** - the file has not been changed or modified when compared with the last commit.
* **Modified** - The file has been edited in some way, either its contents have been altered or other when compared to the same file stored in a last commit.
* **Added** - a new file has been added to the repository, which did not exist in the last commit.
* **Deleted** - a file that existed in the repository in the last commit has since been deleted.

Note that renamed files are treated as files that have been added with the new name and deleted with the old name.

vcontrol tracks these file changes by comparing them to the last commit, which is stored in the `config.json` file, explained in the previous section. vcontrol will look for the commit bin for the last commit made, and compare the working files to the files in that commit bin (and possibly other commit bins, if the last commit made did not alter all of that commit’s working files).

![vcontrol]({{ site.url }}/assets/img_posts/commit.png)

A commit can only be made if any working file has a state besides unchanged. If a commit is made, but some are unchanged files, then those unchanged files are not stored in the new commit bin. vcontrol optimizes space and storage this way, by preventing files that haven’t been changed from being copied a second time. This means that, even though there could be several if not a infinite number of commits for a single file, there will always be one copy of a file for every change of state for that file, regardless of the number of commits. For example, there could be a million commits made to a repository, but if a file added at the first commit hasn’t been modified or deleted before the millionth commit, then there will be only one copy of that file stored, found in the commit bin of the first commit.

Commit are labeled with a commit label. A commit label follows the following format:

`V{commit number, up to 5 unit places}_{username}`

The commit label was designed this way to emphasize user-based fetching. All commits made are specific to that user, so when commits are fetched, they can be referred to by a different label. The commit number, or officially the commit value, is simply a 5 unit number that increases in value with each commit. By limitation of design, this means there can be a maximum of 10\*10\*10\*10\*10 = 100000 possible commits. We intend to introduce a more robust hashing mechanism to offset this flaw in design, however, for purposes of simplicity, this method was used as a placeholder. Ultimately, the focus of this project was to create an effective version control system as a whole.

# Fetching
Distributed, decentralized version control is accomplished in vcontrol using the fetch feature. A fetch in vcontrol uses a specified location of another repository, also known as the target repository, to retrieve that repository’s commits. Due to the way that vcontrol handles commits utilizing commit bins, a single repository can in fact hold commits from multiple repositories at once, storing the target repository’s commits in the `.vcs/commits` subdirectory. In essence, retrieving the commits of other users is an effective way to merge and branch from multiple repositories. This also allows for robust forms of decentralized and remote collaboration operating on different workflows.

![vcontrol]({{ site.url }}/assets/img_posts/fetch_simple.png)

In the example above, a user named `mike` fetches the fourth commit from user `john`’s repository `bar` as `mike`’s starting point for his own repository, `foo`. User `mike` is now free to revert to any of `john`’s commits prior to `V0004_john`. Note that `mike` must specify the revert tag with `john`’s username, since `john` is the one to have commited `V0004` and prior. However, any new commit by `mike` will put it under his own username. 

What has occured here is a very simple fetch such that both users are now working on the same project, assuming `mike` is to continue contribute to the same files that `john` was working on. While they won’t know of each other’s updates unless they choose to fetch from either other again, `mike` has essentially branched from `john`’s project - there is a new file history path that can be traced with its own semi-unique history.

![vcontrol]({{ site.url }}/assets/img_posts/fetch_complex.png)

Projects can become increasingly more complicated such as the example above, where three users interact with vcontrol’s fetch feature to contribute to a single master copy held by user `jack`.

# Revert
Reverting is the act of moving to a previous commit for that repository. From a high level perspective, the concept of reverting is quite simple. Using vcontrol’s revert command and specifying a previous (or future) commit tag, a user can update the working files to match a version that has been previously committed. For example, a user whose most recent commit with the tag `V0004_username` can revert to commit `V0003_username`, and retrieve all the files that existed in the `V0003_username` commit.

The act of reverting uses the `.vcs` file within each commit bin to recursively trace back the previous commit bins to retrieve files that have changed. As explained earlier, only files that have changed state (either deleted, added, or modified) are stored inside the commit bin. Therefore, when a revert is called, the `.vcs` folder of the commit the user wants to revert to is loaded and used to find where the files for that commit exist. In many ways, the purpose of having a `.vcs` JSON file for each commit is to be able to track where all the files for that particular commit live. Indeed, the same file can be stored many times in many different commit bins.

A user can also revert to a commit fetched from another repository.

# Building Into a Usable Tool
As a CLI tool, vcontrol needed to be built with robust terminal commands. To accomplish this, the [argparse package](https://docs.python.org/3/library/argparse.html) was heavily used to manage subcommands with varying argument flags. *[Pyinstaller](https://www.pyinstaller.org/)* was used to bundle the Python source code into a runnable binary executable which could be stored in a folder within a relevant system PATH variable.

# Full Command List
Below is the full command list, which is outputted to the terminal when `vcontrol -h` or `vcontrol --help` is entered in the command line:

```
$ vcontrol --help
usage: vcontrol [-h] action ...
vcontrol is a demo version control system for COEN 317, Distributed Computing.

optional arguments:
  -h, --help  show this help message and exit

command list:
  action
    create    Initializes a new vcontrol repository as the current directory.
    info      Shows information regarding the status of the current
              repository.
    commit    Commits changes in the current repository.
    fetch     Fetches commits from a specified repository.
    revert    Reverts the working directory back to a previous commit stage

$ vcontrol create --help
usage: vcontrol create [-h] repo_name username

positional arguments:
  repo_name   Specified name the vcontrol repo.
  username    Specified username for the vcontrol repo.

optional arguments:
  -h, --help  show this help message and exit

$ vcontrol revert --help
usage: vcontrol revert [-h] commit_tag

positional arguments:
  commit_tag  Specified vcontrol commit to revert the project to.

optional arguments:
  -h, --help  show this help message and exit

$ vcontrol commit --help
usage: vcontrol commit [-h] [-i [IGNORE [IGNORE ...]]]

optional arguments:
  -h, --help            show this help message and exit
  -i [IGNORE [IGNORE ...]], --ignore [IGNORE [IGNORE ...]]
                        Ignores file(s) for commit.
```


# Welcome to Jekyll!
#
# This config file is meant for settings that affect your whole blog, values
# which you are expected to set up once and rarely edit after that. If you find
# yourself editing this file very often, consider using Jekyll's data files
# feature for the data you need to update frequently.
#
# For technical reasons, this file is *NOT* reloaded automatically when you use
# 'bundle exec jekyll serve'. If you change this file, please restart the server process.

# Site settings
# These are used to personalize your new site. If you look in the HTML files,
# you will see them accessed via {{ site.title }}, {{ site.email }}, and so on.
# You can create any custom variable you would like, and they will be accessible
# in the templates via {{ site.myvariable }}.
title: Bryson Lee
email: brysonhlee@gmail.com
description: > # this means to ignore newlines until "baseurl:"
  Bryson Lee's personal website. Pipeline engineer/TD in Animation, VFX, Cinematics, and Games.
baseurl: "" # the subpath of your site, e.g. /blog
url: "https://www.brysonlee.com" # the base hostname & protocol for your site, e.g. http://example.com
twitter_username: jekyllrb
github_username:  jekyll
google_analytics: true

remote_theme: chesterhow/tale

author:
  name: Bryson Lee
  url: https://www.brysonlee.com
  email: brysonhlee@gmail.com

feed:
  path: /assets/feed.xml

# Build settings
markdown: kramdown
permalink: /:year-:month-:day/:title
paginate_path: "/posts/page:num/"
paginate: 5
highlighter: rouge

disqus:
  shortname: brysonlee

plugins:
  - jekyll-paginate
  - jekyll-remote-theme

plugins_dir:
  - jekyll-feed

# Exclude from processing.
# The following items will not be processed, by default. Create a custom list
# to override the default setting.
# exclude:
#   - Gemfile
#   - Gemfile.lock
#   - node_modules
#   - vendor/bundle/
#   - vendor/cache/
#   - vendor/gems/
#   - vendor/ruby/



---
layout: page
title: Projects
permalink: /projects/
web_title: Projects | Bryson Lee
---

# Technical Projects

<h3>Pipeworks Project</h3>
A cloud-based suite of software that enables small to medium sized teams to set up a possibly globally-distributed art pipeline to run efficient CG productions remotely. *Pipeworks* provides a comprehensive, out-of-the-box, yet modular set of tools to streamline CG content creation. The Pipeworks project is comprised of five core components: The *Pipeworks Cloud Repository* (PCR), the *Pipeworks SDK* (PSDK), the *Pipeworks Application Interface* (PAI), the *Pipeworks Tool Suite (PTS)*, and a new UI [design language](https://en.wikipedia.org/wiki/Design_language), *Spout UI*. Most -- if not all -- of Pipeworks was implemented using Python with a combination of various 3rd party frameworks.

<h3>Matterhorn Digital Asset Manager</h3>
Image, video, and file manager for digital art assets including support for most image and video formats. Built multiple administrative tools and interfaces for video transcoding, metrics and diagnostics, meta data tracking, legacy tracking, and indexing helper tools. *Matterhorn* was built using NodeJS, Javascript, Python, Flask, and Google App Engine together with the Google Cloud Platform.

<h3>vcontrol: A Lightweight CG Version Control System</h3>
Increasingly in recent years, digital artists have been using [version control systems (VCS)](https://en.wikipedia.org/wiki/Version_control) originally meant for software developers to manage complex non-text/binary files. In light of this trend, *vcontrol* was developed as a CLI VCS that supports a simplified and lightweight platform allowing artists to stage local versions of art assets before committing  them for review in an existing pipeline. vcontrol was built entirely using Python and packaged using PyInstaller. It supports common VCS commands including commiting, reverting, and branching for distributed version control and remote workflow support. The source code can be viewed [here](https://github.com/bryhlee/vcontrol).
