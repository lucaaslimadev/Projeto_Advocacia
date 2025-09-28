from setuptools import setup, find_packages

setup(
    name='advocacia-app',
    version='1.0.0',
    author='Your Name',
    author_email='your.email@example.com',
    description='A Tkinter-based GUI for managing legal documents.',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=[
        'tkinter',
        'sqlite3',
        # Add other dependencies as needed
    ],
    entry_points={
        'gui_scripts': [
            'advocacia-app = main:main',  # Adjust if your main function is named differently
        ],
    },
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)